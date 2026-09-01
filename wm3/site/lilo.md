---
title: LILO — the case study
route: lilo
topic: lilo
---
LILO runs the whole classroom in the browser. Every online coding course pays a cloud bill each time a student presses Run. That bill is why free tiers are stingy, why feedback is slow, and why a $60 Chromebook is a second-class citizen. LILO deletes the bill.

The runtime: Python runs on Pyodide. Java — the hard one — runs on CheerpJ. C, C++ and Rust compile through the WASI component model. Nothing leaves the tab, so marginal execution cost is zero and cold start stops being a server problem. Behind it is an async Go API orchestrating Cloudflare edge workers, which took p95 cold start from about 15 seconds to under 150ms on low-spec hardware. TypeScript and Tailwind on top, Postgres and Kubernetes underneath.

The tutor: a quantized model runs locally through WebNN, so hints arrive without an inference bill or a privacy conversation. It reads the student's actual code, not a lesson template, and it is allowed to say "you're close" instead of grading.

Why Max: LinkedInOrLeftOut started in July 2022 as mock interviews and resume rewrites. Since then, 3,000+ students equipped for SWE roles, interviews at 100+ companies including every FAANG, and ten-plus workshops with NSBE, ColorStack, UMD and USF. Teaching first, platform second; the product knows where people get stuck because the team watched it happen.
