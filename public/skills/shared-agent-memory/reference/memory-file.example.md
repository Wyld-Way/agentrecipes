<!-- Reference: one durable memory = one small file with this frontmatter.
     `description` is what an agent reads to judge relevance before loading the body. -->
---
name: deploy-target-is-staging
description: App pushes go to the staging environment, which is what real users hit
type: reference        # user | preference | project | decision | reference
---

App builds are pushed to the **staging** environment, not a separate prod — staging
is what real users are on. Verify the target before any release.

Related: [[release-checklist]], [[no-direct-prod-deploys]]

<!-- Notes on the fields:
     name        — stable kebab-case slug; also the link target for [[name]]
     description — ONE line; the recall filter, so make it specific
     type        — the four homes: durable knowledge (user/preference/reference),
                   project status, or a decision. Plans live as dated files, not here.
     body        — the single fact. For preferences/decisions, add a line on WHY
                   and HOW to apply it. Link related memories liberally. -->
