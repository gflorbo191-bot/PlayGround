#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
: "${CAPTURE_URL:?Set CAPTURE_URL to the exact preview URL to capture}"
: "${CAPTURE_DIR:?Set CAPTURE_DIR to the evidence output directory}"
export CAPTURE_URL CAPTURE_DIR

/usr/bin/time -p mkdir -p "$CAPTURE_DIR"
/usr/bin/time -p node --input-type=module - <<'NODE'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { mkdirSync, readFileSync } from 'node:fs'

const runtime = join(process.env.HOME, '.local/share/omgithub-playwright')
if (process.platform === 'linux') process.env.DISPLAY ||= ':' + readFileSync(join(runtime, 'display'), 'utf8').trim()
const require = createRequire(join(runtime, 'package.json'))
const { chromium } = require('playwright')
const config = JSON.parse((await import('node:fs')).readFileSync(
  join(runtime, process.platform === 'darwin' ? 'metal.json' : 'linux.json'), 'utf8'
))
const url = process.env.CAPTURE_URL
const output = process.env.CAPTURE_DIR
mkdirSync(output, { recursive: true })
let browser
let exitCode = 0
const fail = (message, code = 1) => {
  console.error(message)
  exitCode = code
}

try {
  try {
    browser = await chromium.launch({ ...config.browser.launchOptions, timeout: 30000 })
  } catch (error) {
    fail(`Browser infrastructure failure: ${error.message}`, 75)
  }

  if (browser) {
    for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
      let page
      try {
        try {
          page = await browser.newPage({ viewport: { width, height } })
        } catch (error) {
          fail(`Browser infrastructure failure creating ${name} page: ${error.message}`, 75)
          break
        }
        page.setDefaultTimeout(30000)
        const pageErrors = []
        page.on('pageerror', error => pageErrors.push(error.message))

        let response
        try {
          response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
        } catch (error) {
          fail(`Temporary navigation failure for ${name}: ${error.message}`, 75)
          break
        }
        if (!response) {
          fail(`No HTTP response while loading ${url}`, 75)
          break
        }
        if (!response.ok()) {
          const status = response.status()
          fail(`Preview returned HTTP ${status} for ${name}`, [408, 429, 500, 502, 503, 504].includes(status) ? 75 : 1)
          break
        }

        try {
          await page.waitForFunction(() => {
            const canvas = document.querySelector('canvas')
            const brand = document.querySelector('.brand')
            const intro = document.querySelector('#startBtn')
            return document.visibilityState !== 'hidden' && canvas && canvas.width > 0 && canvas.height > 0 &&
              brand?.textContent?.includes('LONG') && intro && intro.getBoundingClientRect().width > 0
          }, undefined, { timeout: 60000 })
          await page.waitForFunction(() => document.fonts.status === 'loaded', undefined, { timeout: 15000 })
          await page.waitForTimeout(1200)
        } catch (error) {
          fail(`Rendered app did not become ready in ${name}: ${error.message}`)
          break
        }

        if (pageErrors.length) {
          fail(`Rendering error in ${name}: ${pageErrors.join('; ')}`)
          break
        }
        const imagePath = join(output, `final-${name}.png`)
        try {
          await page.screenshot({ path: imagePath, timeout: 30000 })
        } catch (error) {
          const browserFailure = error.name === 'TimeoutError' || !browser.isConnected()
          fail(`${browserFailure ? 'Temporary browser failure' : 'Capture script failure'} in ${name}: ${error.message}`, browserFailure ? 75 : 1)
          break
        }
        console.log(`Captured ${name}: ${imagePath}`)
      } catch (error) {
        fail(`Capture script/rendering failure in ${name}: ${error.message}`)
        break
      } finally {
        await page?.close().catch(error => {
          console.error(`Could not close ${name} page: ${error.message}`)
          exitCode ||= 75
        })
      }
    }
  }
} finally {
  await browser?.close().catch(error => {
    console.error(`Could not close capture browser: ${error.message}`)
    exitCode ||= 75
  })
}
process.exitCode = exitCode
NODE
