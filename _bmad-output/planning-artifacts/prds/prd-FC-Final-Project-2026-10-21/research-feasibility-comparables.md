# Research: input feasibility and comparable products

- **Prepared:** 2026-10-21, as PRD input for the run `prd-FC-Final-Project-2026-10-21`
- **Question:** Can the tool take an Instagram or TikTok profile or post URL as input, and read the posts through official means? What are the fallbacks? Who else does something similar?
- **Method:** Web research on official platform docs. I also ran a few direct checks on official endpoints and policy files, all on 2026-10-21:
  - fetched `robots.txt` for instagram.com and tiktok.com;
  - called TikTok's oEmbed endpoint with the example URL from TikTok's own docs;
  - sent TikTok short links with made-up codes to see how they redirect;
  - read the Claude Artifact runtime type definitions (contract 0.2.88) that ship with this Claude Code install.
- **What I did not do:** I fetched no personal Instagram or TikTok profile or post. Wherever a claim needed a real target post to confirm, it is marked **UNVERIFIED**.

Confidence labels: **[doc]** = official documentation, **[probe]** = observed by a direct request today, **[2nd]** = secondary source, **UNVERIFIED** = could not confirm.

---

## Summary of verdicts

| # | Question | Verdict |
|---|---|---|
| 1 | Instagram: can a third-party app read captions for a URL it does not own? | **Not in a usable way.** Basic Display was retired on 2024-12-04. The Graph API reads only your own account's posts. Business Discovery can read other professional accounts by username, but the caller needs its own professional account plus App Review for real users. oEmbed requires App Review and Business Verification, and Meta **prohibits** using its output for anything other than displaying an embed, analytics included. Scraping is barred by the Terms of Use, Meta's Automated Data Collection Terms, and robots.txt. |
| 2 | TikTok: oEmbed, Display API, Research API, short links | **oEmbed is the only open route.** It needs no auth and allows calls from any origin. The docs say it returns `title` (the caption). **But** today's call on the docs' own example returned no `title`. Display API reads only the authorizing creator's own videos. Research API is for academics only; this project is not eligible. Short links resolve through an HTTP 302 `Location` header. |
| 3 | Can Claude fetch the URL? Can an Artifact? | **No to both.** Web fetch honors robots.txt: Instagram blocks every crawler and TikTok blocks `Claude-User` by name. Web fetch also cannot run JavaScript. Even if it worked, it would breach Meta's and TikTok's automated-collection terms. An Artifact's network is blocked, and its `sample` call to Claude "cannot browse". |
| 4 | Video posts | **Claude takes no video or audio input.** It accepts text, images and PDFs. MVP route: a transcript the user pastes, plus 3-6 screenshots. A file upload with server-side speech-to-text is possible later but is real infrastructure work. |
| 5 | Comparables | No tool found that scores **church or ministry posts from simulated non-believer viewpoints**. The nearest neighbours are human "secret worshipper" audits, LLM audience simulators (Artificial Societies' Reach, Ask Rally), synthetic-persona research (Synthetic Users, Simile, Aaru), and Christian AI tools for *producing* content (Pulpit AI, ChurchSocial, Gloo). |

**Recommendation in one line:** make the MVP input **post-level content supplied by the user**: pasted caption and transcript, plus screenshots. Keep the URL as a reference field that is never fetched. In week 2, add one optional extra: a TikTok single-post URL that pre-fills the caption through oEmbed on the server. Move profile-level audits out of the MVP.

---

## 1. Instagram

### 1a. Instagram Basic Display API: retired
- Meta announced on 2024-09-04 that the API was ending, and it shut down on **2024-12-04**. Requests after that date return errors. Meta says no consumer-facing Instagram API set remains. [doc] ([Meta blog](https://developers.facebook.com/blog/post/2024/09/04/update-on-instagram-basic-display-api), [Basic Display docs](https://developers.secure.facebook.com/docs/instagram-basic-display-api))

### 1b. Instagram API (with Instagram Login or Facebook Login): your own accounts only
- It reads the media, including captions, of **professional accounts that granted your app access**.
- **Standard Access** works without App Review, but only for people who hold a role on the app or accounts you own or manage.
- Serving accounts you do not own requires **Advanced Access**, which means App Review plus Business Verification. [doc] ([Instagram Platform overview](https://developers.facebook.com/docs/instagram-platform/overview), [App Review](https://developers.facebook.com/documentation/instagram-platform/app-review))
- One third-party guide (2026-07) puts App Review at 2-4 weeks. [2nd] ([Phyllo](https://www.getphyllo.com/post/instagram-api-permissions-scopes))
- **Fit:** this is the compliant way for a church to audit *its own* feed. A church would connect its account through OAuth. For anyone without an app role, it does not fit a one-week prototype.

### 1c. Business Discovery: the only official route to *other* accounts
- **What it does:** looks up another account by username, for example `GET /{your-ig-user-id}?fields=business_discovery.username(X){followers_count,media_count,media{...}}`. [doc] ([Business Discovery guide](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-facebook-login/business-discovery.md), updated 2025-10-16)
- **Caller requirements:**
  - its own Instagram professional account, reached through Facebook Login;
  - a Facebook User access token;
  - the permissions `instagram_basic`, `instagram_manage_insights` and `pages_read_engagement`. [doc] ([reference](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/business_discovery))
- **Target requirements:**
  - The target must be a **Business or Creator** account.
  - Personal accounts are not covered. Many individual Christians use personal accounts.
  - Age-gated accounts return nothing.
  - You cannot GET a single media object directly. To match a post URL you would have to page through `media` and compare permalinks. [doc]
- **Captions:** the IG Media reference lists `caption` as a public field, with `@` mentions stripped for non-admins. [2nd/doc snippet] Whether captions come back inside the nested Business Discovery `media` edge is **UNVERIFIED**, because the docs' examples show only counts.
- **Fit:** technically, Bennett could use this in **development mode as an app-role user**, with his own professional account linked to a Facebook Page, and no review. It would read *professional* church accounts. Production use needs Advanced Access, App Review and Business Verification.
- This is the only realistic path to **profile-level** reading. It belongs in a later phase, not the MVP.

### 1d. Instagram oEmbed (`GET graph.facebook.com/instagram_oembed`)
- **Access:** requires the **Meta oEmbed Read** feature (`meta_oembed_read`), which replaced `oembed_read`. Live data needs a completed **App Review** and is "only available with business verification". [doc] ([feature reference](https://developers.facebook.com/docs/features-reference/oembed-read))
- An unauthenticated call returns HTTP 400. [probe]
- **Fields returned:**
  - Today: `html`, `provider_name`, `provider_url`, `type`, `version` and `width`. [doc] ([reference](https://developers.facebook.com/docs/graph-api/reference/instagram-oembed/))
  - Removed from **2025-11-03**: `author_name`, `author_url`, `thumbnail_url`, `thumbnail_width` and `thumbnail_height`. [doc] ([Meta blog 2025-04-08, updated 2025-10-08](https://developers.facebook.com/blog/post/2025/04/08/oembed-updates/))
- **Caption:** there is no caption field. The caption appears only inside the embed `html`, unless `hidecaption=true`.
- **Usage restriction (the deciding fact):** the endpoint "is **only** meant to be used for embedding Instagram content". Using its metadata or content "for any purpose other than providing a front-end view" is strictly prohibited, **including analytics**. [doc] ([oEmbed guide](https://developers.facebook.com/docs/instagram-platform/oembed))
  - So parsing the caption out of `html` and sending it to Claude is **not compliant**.
- **Other limits:** 1,000 requests per hour. No private, inactive, age-restricted or embed-disabled accounts. No Stories. [doc]
- **Fit:** at most a visual embed preview next to the report, and only after App Review. Not an input path.

### 1e. Terms on automated collection
- **Instagram Terms of Use:** you may not "collect information in an automated way without our express permission". [2nd: court-filed copy, [lb7.uscourts.gov PDF](https://www.lb7.uscourts.gov/documents/19-1861URL1Termsofuse.pdf)] The live help-center page did not render for me, so the current wording is **UNVERIFIED**.
- **Meta Automated Data Collection Terms (effective 2024-10-07):** "You will not engage in Automated Data Collection without first obtaining Meta's express written permission." They also restrict use of collected data to search results and URL previews. [doc] ([terms](https://www.facebook.com/legal/automated_data_collection_terms))
- **instagram.com/robots.txt:** the file opens with a notice that automated collection is prohibited without express written permission. It names `ClaudeBot` with `Disallow: /`, and ends with `User-agent: *` and `Disallow: /`. [probe, 2026-10-21]
- **Litigation context:** in *Meta v. Bright Data*, a court reportedly limited the reach of Meta's terms to logged-in scraping. [2nd] ([Zyte summary](https://www.zyte.com/blog/california-court-meta-ruling)) This is a legal gray zone, not a green light. For a student project, treat scraping as out.

### 1f. Single post URL or profile URL?
- **A single post is more feasible.** It is a bounded unit, and the user can easily copy its caption and screenshot it.
- No official route reads a non-owned post by URL for analysis. Even so, the post is the natural unit for the paste-and-upload fallback.
- A **profile** needs a media listing. Only Business Discovery (professional accounts, plus App Review) or owner OAuth can provide one.

---

## 2. TikTok

### 2a. oEmbed (`GET https://www.tiktok.com/oembed?url=...`)
- **Auth:** the docs list none. The response carries `access-control-allow-origin: *`, so a browser can call it from any origin. [doc + probe] ([Embed Videos](https://developers.tiktok.com/doc/embed-videos), updated 2026-08-04)
- **Documented response:** `title` (the example value is caption text plus hashtags), `author_name` (display name), `author_url`, `thumbnail_url` (720x1280), `html` (a blockquote plus `embed.js`), and `provider_*`. [doc]
- **Today's call disagreed with the docs.** [probe] I called oEmbed on TikTok's documented example video (`@scout2015/video/6718335390845095173`). It returned only these keys: `version`, `type`, `width`, `height`, `html`, `provider_name`, `provider_url`, `embed_type` and `embed_product_id`.
  - There was **no `title`, `author_name` or `thumbnail_url`**.
  - The `html` was an `<iframe>` pointing to `tiktok.com/player/v1/{id}`, not the documented blockquote.
  - This may be specific to that 2019 video, or it may be a real API change. **UNVERIFIED for current posts. Test with a real target post before building on `title`.**
- **Profile URLs:** these return only a profile embed (display name and link) and **no posts or captions**. Private and underage accounts cannot be embedded. [doc] ([Embed Creator Profiles](https://developers.tiktok.com/doc/embed-creator-profiles))
- **Terms:** the embed docs state no usage restriction on oEmbed metadata, unlike Meta's. However, TikTok's US Terms of Service section 3.4 (updated 2026-07-15) bars users from trying to "scrape, crawl, export or otherwise extract any data or content in any form, for any purpose" without written approval. [doc] ([ToS](https://www.tiktok.com/legal/page/us/terms-of-service/en))
  - A user-initiated, one-at-a-time oEmbed call for a post the user chose is the most defensible reading.
  - Whether oEmbed `title` may be used for analysis is **UNVERIFIED**: I did not find TikTok's developer or embed terms.

### 2b. Display API: the authorizing creator's own videos only
- **Endpoints:** `/v2/user/info/`, `/v2/video/list/` and `/v2/video/query/`.
- **Scopes:** `user.info.basic` and `video.list`, through Login Kit OAuth. The get-started guide lists approval of Login Kit and the API product as prerequisites. [doc] ([overview](https://developers.tiktok.com/doc/display-api-overview), updated 2026-08-04)
- **Video object fields:** `video_description` and `title` (both documented as max 150 characters), `cover_image_url` (the link expires after 6 hours), `share_url`, `embed_html`, `duration`, counts and `is_aigc`. **There is no transcript field.** [doc] ([video object](https://developers.tiktok.com/doc/tiktok-api-v2-video-object), updated 2026-08-24)
- **Sandbox:** no review needed, up to 10 target users who must be accounts **you own**. Whether Display API returns data in sandbox is **UNVERIFIED**. [doc] ([sandbox](https://developers.tiktok.com/doc/add-a-sandbox))
- **Fit:** owner-connect only, the same pattern as 1b. It cannot read other creators' videos.

### 2c. Research API: not eligible
- **Who qualifies:**
  - Academic institutions in the US, EEA, UK, Canada or Switzerland.
  - PhD candidates, with a letter from their advisor.
  - Independence from commercial interests, ethics review and a research proposal are also required.
  - TikTok says to expect a response "within 4 weeks". [doc] ([Research API](https://developers.tiktok.com/products/research-api))
  - One institute reported about 21 months to working access. [2nd] ([KInIT](https://kinit.sk/when-research-apis-close-the-door-when-you-finally-get-it-it-is-not-what-you-have-asked-for/))
- **Data it would offer:** it *does* expose `video_description` and `voice_to_text` (subtitle and speech-to-text text). [doc] ([query videos spec](https://developers.tiktok.com/docs/en/research-api-specs-query-videos), updated 2026-08-19)
- **Fit:** none for a course project on this timeline.

### 2d. Short links (`vm.tiktok.com`, `vt.tiktok.com`)
- Both hosts answer with **HTTP 302** and a `Location` header. With made-up codes they redirect to `https://www.tiktok.com/?_r=1`. [probe]
- Real codes are reported to redirect to the canonical `/@user/video/{id}` URL. [2nd] ([WebmasterWorld thread](https://www.webmasterworld.com/php/5063936.htm))
- Passing a short link straight to oEmbed returned HTTP 400 in my probe. The code was made up, so this is inconclusive.
- **Approach:** resolve the link on the server by reading the first `Location` header, then call oEmbed with the canonical URL.
- An Artifact cannot do this, because its network is blocked (see 3c).

### 2e. robots.txt
- tiktok.com lists `Claude-User`, `ClaudeBot`, `Claude-SearchBot` and `anthropic-ai` together with `Disallow: /`. [probe, 2026-10-21]

---

## 3. Claude-side fetching

### 3a. Web fetch tool (Messages API, server tool)
- **Versions:** `web_fetch_20250910` (basic) through `web_fetch_20260318` (dynamic filtering and response inclusion). Available on the Claude API with **no extra cost** beyond tokens. [doc] ([web fetch](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-fetch-tool))
- **URL rules:** it can fetch only URLs that appear in a user message, a client tool result, or an earlier search or fetch result.
- **No JavaScript:** it "does not support websites dynamically rendered with JavaScript".
- **Blocked URLs:** the error `url_not_allowed` covers "Anthropic-side restrictions, such as ... `robots.txt`".
- **Verdict:** for Instagram (`*` disallow-all) and TikTok (`Claude-User` disallowed), fetches should fail with `url_not_allowed`. Even if a fetch succeeded, both sites render post content client-side.
  - Using it to read posts would also run against Meta's Automated Data Collection Terms and TikTok ToS 3.4.
  - **Not a ToS-compliant input path.** I did not run a live fetch against a real post. I inferred the result from the documented robots.txt rule and today's robots.txt files.

### 3b. Web search tool
- **Versions:** `web_search_20250305`, `_20260209` and `_20260318`. Costs $10 per 1,000 searches plus tokens. Returns titles, URLs and encrypted page content, with citations. [doc] ([web search](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool))
- **Verdict:** it may surface a public post's text when a search engine has indexed it. It cannot reliably fetch a *specific* post's caption, and coverage of Instagram and TikTok is thin. Not an input path.
- **Other use:** it is fine for context, such as a church's public website.

### 3c. Claude Artifacts
- **Calling Claude from the page:** the page calls Claude through the `sample` capability, declared as `capabilities: {sample: {}}`, or `{sample: {images: true}}` to send images. [doc: runtime contract 0.2.88, `sample.d.ts`]
- **What `sample` cannot do:**
  - Each call "cannot browse, remembers nothing between calls, has no tools except the page functions you pass".
  - "The page cannot fetch images from URLs (its network is blocked): ask the viewer to pick or drop the file."
  - Scripts load only from approved CDNs.
- **Cost and consent:** calls spend the **viewer's own Claude usage** and ask for consent on first use. A demo audience will see a consent prompt.
- **Images:** accepted up to `sample.limits().images.maxCount` per call. claude.ai's general cap is 20 images per message. [doc] ([vision](https://platform.claude.com/docs/en/build-with-claude/vision))
- **One technical exception, excluded:** the `mcp` capability can declare `host:claude_browser`, which lets a page drive the viewer's browser in a Cowork desktop session with per-site approval. That is still automated collection from Instagram and TikTok, so it is excluded for the same ToS reasons.
- **Verdict:** **the Artifact can take pasted text and dropped images only.** A URL field in the Artifact can be stored and displayed but never resolved.

---

## 4. Video posts: evaluating spoken content

**Claude input modalities:** text, images (JPEG, PNG, GIF and WebP; an animated GIF uses only its first frame) and PDFs. The Vision and Features docs list **no video or audio input**, and the API has no speech-to-text feature. [doc] ([vision](https://platform.claude.com/docs/en/build-with-claude/vision), [features overview](https://platform.claude.com/docs/en/build-with-claude/overview))

| Option | Surface | Effort | Notes |
|---|---|---|---|
| **User-pasted transcript or script**, plus caption | Artifact + web app | none | Best signal per unit of effort. The ministry often has the script, or the sermon text the clip came from. TikTok shows auto-captions but offers no copy-all or export [2nd] ([Argil](https://www.argil.ai/blog/tiktok-transcript)). Mark the report's transcript as "user-supplied". |
| **3-6 screenshots** (key frames, on-screen text, caption overlay) | Artifact (`sample` with images) + web app | low | Captures the visual tone and text overlays that a transcript misses. API limits: 10 MB per image, 100-600 images per request; claude.ai allows 20 per message. |
| **Owner-uploaded video file**, then speech-to-text plus frame sampling, then Claude | web app (stretch) | high | Vercel functions have a **hard 4.5 MB request-body limit** [doc] ([Vercel KB](https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions)), so the browser must upload straight to Supabase Storage (50 MB per-file cap on the Free plan; resumable TUS above 6 MB) [doc/2nd] ([Supabase](https://supabase.com/docs/guides/troubleshooting/upload-file-size-restrictions-Y4wQLT.md)). Needs a third-party speech-to-text service and ffmpeg in a worker. Not for week 2. |
| **Owner OAuth** (Instagram API `media_url`, TikTok Display API) | web app (later) | high | Own content only; App Review for non-role users. TikTok Display API has no transcript field. |
| **TikTok Research API `voice_to_text`** | none | n/a | Not eligible (2c). |

**MVP recommendation:** a transcript field and a screenshot drop-zone. The rubric and the persona prompts should say when spoken content was **not** provided, so Claude does not invent what the video said.

---

## 5. Comparable products

Most product descriptions below come from vendors, and none of the accuracy claims has been checked independently.

### 5a. Church and ministry audits (closest in *purpose*)
- **Secret worshipper / mystery guest audits** ([Baptist News Global](https://baptistnews.com/article/secret-church-shopper-reports-quality-of-welcome-determines-if-guests-will-visit-a-second-time), [UMC Mystery Guest Audit PDF](https://resourceumc.org/-/media/umc-media/2019/02/12/01/44/mystery_guest_audit.pdf)): paid human consultants, such as Greg Atkinson, visit anonymously and review the church's online footprint, with social media listed as the *first* touchpoint. This is the human version of this product's job. It is in person, slow, and not focused on non-believers.
- **"AI visibility" tools for churches** (Trakkr, OtterlyAI and others; [Trakkr guide, 2026-07](https://trakkr.ai/resources/industry-tools/best-ai-visibility-tools-for-churches)): measure how a church appears in AI answer engines. This is about discovery, not how the content is perceived.
- **Market context:** the Pushpay and Barna 2026 State of Church Technology report says 97% of churches use social media and only 5% have an AI policy. [2nd press release] ([GlobeNewswire 2026-03-09](https://www.globenewswire.com/news-release/2026/03/09/3251986/0/en/Pushpay-and-Barna-Group-s-2026-State-of-Church-Technology-Report-Shows-Church-Tech-Has-Moved-Past-Adoption-Now-Alignment-Is-What-Matters.html))

### 5b. Audience-perception simulation (closest in *mechanism*)
- **Artificial Societies: Reach** (YC W25): simulates your LinkedIn audience with 100-300 personas built from public profile data. It scores a post before publishing and generates about 100 variants in your voice. The company self-reports R² 0.78. It is moving toward enterprise work with "Radiant". ([YC](https://ycombinator.com/companies/artificial-societies), [Product Hunt](https://www.producthunt.com/p/reach-10/reach-by-artificial-societies), [Launch HN](https://hn.svelte.dev/item/44755654)) This is the nearest technical analog: post-level scoring by a simulated audience. It is secular and has no rubric for faith or witness.
- **Ask Rally** (Irreality Labs): runs AI-simulated persona panels against ads, content and messaging before launch. ([Dealroom](https://app.dealroom.co/companies/rally), [Every](https://every.to/also-true-for-humans/ai-focus-groups-are-a-step-on-the-path-to-superhuman-advertising))

### 5c. Synthetic-persona user research
- **Synthetic Users:** AI-generated interview participants producing transcripts and themed reports. Free trial and $49 a month Pro per G2. ([docs](https://docs.syntheticusers.com/guides/core-concepts), [G2](https://ai.g2.com/marketplace/tools/syntheticusers))
- **Simile:** spun out of the Stanford "Smallville" generative-agents research and sells simulated users for marketing and product teams. Raised $200M at a $2B valuation. ([TechCrunch](https://techcrunch.com/?p=3148353), [Mezha](https://mezha.net/eng/?p=3228552))
- **Aaru:** population-scale behaviour simulation for agencies and campaigns. Series A at a roughly $1B headline valuation, December 2025. ([TechCrunch 2025-12-05](https://techcrunch.com/2025/12/05/ai-synthetic-research-startup-aaru-raised-a-series-a-at-a-1b-headline-valuation))
- **Critique to design for:** NN/g says "UX without real-user research isn't UX". ([NN/g](https://nngroup.com/articles/synthetic-users/)) Vendors in the space concede synthetic respondents suit hypothesis generation, not validation. This supports the brief's plan to produce **real non-believer interview plans** alongside the simulation.

### 5d. Christian-specific AI tools (they produce content; none evaluates it)
- **Pulpit AI** (Subsplash; built on Claude): turns a sermon into 20 or more pieces such as clips, captions, discussion guides and emails. ([Anthropic customer story](https://www.anthropic.com/customers/pulpit-ai))
- **ChurchSocial** (formerly Discipls): scheduler with AI captions, Sermon Studio clips and a graphics studio. Integrates with Planning Center, Pushpay and Tithely. ([faith.tools](https://faith.tools/app/churchsocial-formerly-discipls))
- **Outreach Social, Pastors.ai, Gloo Church.Tech, ChurchCopy.ai:** sermon clipping and AI copy for church communications. ([Outreach](https://outreach.com/app/OutreachSocial), [Capterra](https://www.capterra.co.uk/software/1081009/Pastors-ai), [Gloo help](https://help.gloo.us/en/articles/8977440-how-to-use-ai-to-boost-your-church-communication))
- **Gloo Flourishing AI Christian (FAI-C) Benchmark** (December 2025): 807 questions across 7 dimensions that score *LLMs* against a Christian worldview. It points the other way, judging AI by Christian criteria rather than Christian content by outsiders' reactions. It is a useful precedent for a **versioned, judge-scored rubric**. ([Gloo press release](https://gloo.com/press/releases/gloo-unveils-the-first-benchmark-exposing-how-ai-misses-christian-worldview-and-values))
- **Persona grounding data:** Barna's research on how non-Christians perceive Christianity could anchor the personas. Examples: low favourability among non-Christians aged 16-29, and hypocrisy as the top objection. The publication dates of those figures are **UNVERIFIED**. ([Barna](https://www.barna.com/research/a-new-generation-expresses-its-skepticism-and-frustration-with-christianity/))

**Positioning gap:** I found no product that combines (a) Christian or ministry content, (b) multiple simulated *non-believer* personas, (c) a versioned witness rubric, and (d) plans to interview real outsiders. Artificial Societies is the closest mechanism and secret-worshipper audits the closest purpose.

---

## Recommendations

### Friday Artifact demo (2026-10-23)
- **Primary input:** paste the post's caption, plus a transcript or script for video, plus an optional drop of 1-6 screenshots, sent through `sample` with `images: true`. A platform selector (Instagram or TikTok) and a post-type selector (image, carousel or video) give the rubric context.
- **URL field:** optional. It is stored and shown as a reference only and **never fetched**. The UI should say so plainly, for example "We don't pull from Instagram or TikTok; paste or upload".
- **Profile URLs:** out of scope. Offer "audit several posts" by pasting 3-5 posts in turn instead.
- **Demo safety net:** two or three pre-loaded example posts, so the demo does not depend on live pasting. Use Bennett's own content, content a ministry has consented to share, or examples clearly labelled as illustrative.

### Week-2 web app (Next.js on Vercel with Supabase)
- **Primary input:** the same paste and screenshot flow. Screenshots go straight from the browser to Supabase Storage to avoid Vercel's 4.5 MB body limit, then pass to Claude as image blocks on the server.
- **Optional TikTok pre-fill:** for a single post URL, the server resolves `vm.` and `vt.` short links by reading the `Location` header, calls oEmbed, and pre-fills the caption from `title`. The user confirms or edits the text, and the report records "source: TikTok oEmbed".
  - **Gate this on a day-1 check** that oEmbed still returns `title` for current posts. Today's probe suggests it may not.
- **Instagram URL:** paste and screenshots only. oEmbed needs App Review and Business Verification and forbids analytic use, so do not pre-fill.
- **Not recommended:** Claude web fetch, web search for posts, headless browsers, or any third-party scraper (Apify and similar).

### Fallback (both surfaces)
- Paste caption plus transcript, plus screenshots. If the TikTok pre-fill returns nothing, drop silently to this flow.
- With no transcript for a video, the report evaluates caption and visuals only and **says** that spoken content was not assessed.

### Later phases (out of MVP; flag in the PRD's "out of scope / future" section)
1. **Owner-connect** (Instagram API with Instagram Login, TikTok Login Kit and Display API) so a ministry audits *its own* feed. Without review this works only for app-role or sandbox accounts; real users need App Review.
2. **Business Discovery** for profile-level audits of *professional* church accounts. Needs Bennett's own professional account, a Facebook Page, and Advanced Access through App Review and Business Verification. Personal accounts can never be covered.
3. **Video upload pipeline** with speech-to-text and frame sampling.

---

## Not verified (do before relying on it)
1. Whether TikTok oEmbed still returns `title`, `author_name` and `thumbnail_url` for **current** public posts. Today's call on the docs' 2019 example returned none of them.
2. Whether TikTok's developer or embed terms allow oEmbed metadata to be used for analysis. Not found.
3. Whether captions come back in Business Discovery's nested `media` edge. Not tested.
4. Whether TikTok Display API returns data in sandbox mode.
5. Whether TikTok oEmbed accepts short links directly. My probe used made-up codes only.
6. The live wording of the Instagram Terms of Use. The help-center page did not render, so I relied on a court-filed copy.
7. Claude web fetch behaviour on a real Instagram or TikTok post. Inferred from robots.txt and the docs, not tested.
8. Publication dates of the Barna figures, and every vendor's accuracy or adoption claims.
