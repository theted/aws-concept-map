# Deployment

Static site on S3 + CloudFront — archetype A in the private
[theted/infrastructure](https://github.com/theted/infrastructure) repo (`static-s3.md`). Read that
for the reasoning; this file holds only what is specific to this app.

```
  push to master ──▶ GitHub Actions ──▶ S3 (private) ──▶ CloudFront ──▶ aws-concept-map.sundbergsolutions.se
                     test + build        via OAC           *.sundbergsolutions.se cert (us-east-1)
```

| | |
|---|---|
| Hostname | `aws-concept-map.sundbergsolutions.se` |
| Bucket | `aws-concept-map.sundbergsolutions.se` (eu-west-1) |
| Distribution | `E1QHQ9IB6BX3DX` (`d1tjnaz6ymzywm.cloudfront.net`) |
| Workflow | `theted/workflows/.github/workflows/deploy-static.yml@master` |
| DNS | one.com — `CNAME` to the distribution |

It used to run as a Lambda container behind a Function URL. The handler only served `dist/`, so
it was a server doing a bucket's job; it never had a custom domain either.

## One-time setup

Account `471112549477`. Do not request a certificate — the wildcard `*.sundbergsolutions.se`
already exists in us-east-1.

1. **Bucket** `aws-concept-map.sundbergsolutions.se` in `eu-west-1`. Block all public access, no
   static website hosting.
2. **CloudFront distribution**, origin = the bucket with **Origin access control** (let the console
   write the bucket policy). Then, both of which fail silently if skipped:
   - Default root object: `index.html`
   - Alternate domain name: `aws-concept-map.sundbergsolutions.se`, certificate
     `*.sundbergsolutions.se`

   Plus: Redirect HTTP to HTTPS, `Managed-CachingOptimized`, compression on. **No** custom error
   responses — selection lives in the URL hash (`#service=…`), so there are no client-side paths
   for S3 to 403 on.
3. **IAM user** `aws-concept-map-deploy`, with only:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       { "Effect": "Allow", "Action": "s3:ListBucket",
         "Resource": "arn:aws:s3:::aws-concept-map.sundbergsolutions.se" },
       { "Effect": "Allow", "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
         "Resource": "arn:aws:s3:::aws-concept-map.sundbergsolutions.se/*" },
       { "Effect": "Allow", "Action": "cloudfront:CreateInvalidation",
         "Resource": "arn:aws:cloudfront::471112549477:distribution/DISTRIBUTION_ID" }
     ]
   }
   ```

4. **GitHub secrets** — the same names every repo uses. The existing `AWS_ACCESS_KEY_ID` /
   `AWS_SECRET_ACCESS_KEY` belong to the old Lambda deploy user; replace them.

   ```bash
   gh secret set AWS_ACCESS_KEY_ID          --repo theted/aws-concept-map
   gh secret set AWS_SECRET_ACCESS_KEY      --repo theted/aws-concept-map
   gh secret set AWS_REGION                 --repo theted/aws-concept-map --body eu-west-1
   gh secret set S3_BUCKET                  --repo theted/aws-concept-map --body aws-concept-map.sundbergsolutions.se
   gh secret set CLOUDFRONT_DISTRIBUTION_ID --repo theted/aws-concept-map --body <id>
   ```

5. **DNS at one.com**: `CNAME`, host `aws-concept-map`, target the distribution's
   `dxxxxxxxxxxxxx.cloudfront.net` (add a trailing dot if the panel refuses it).

6. **Retire the Lambda stack**: the `aws-services-concept-map` function, its Function URL, the
   `aws-services-concept-map-role` role, the ECR repository and the old deploy user.

## Deploying

Push to `master`. The workflow runs the tests, builds, and syncs in three passes (new
`assets/*` → everything else with `--delete` → sweep old assets), then invalidates CloudFront.

Verify what a visitor gets, not what the console says:

```bash
dig +short aws-concept-map.sundbergsolutions.se
curl -sS -o /dev/null -D - -H 'Accept-Encoding: gzip, br' https://aws-concept-map.sundbergsolutions.se/ \
  | grep -iE '^(HTTP|content-type|cache-control|content-encoding|x-cache)'
```

Expect `200`, `cache-control: public, max-age=0, must-revalidate` on `/`, and `immutable` on
anything under `/assets/`.
