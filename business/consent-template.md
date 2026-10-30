# Parental Consent Template

**Purpose:** The operator sends this email to each family before sharing their setup link. The parent's reply constitutes written consent. Keep the email thread as your record.

---

## Email Template

**Subject:** Days Out in Summer — Family Invitation + Privacy Info

Hi [Parent name],

I'd like to invite your family to try Days Out in Summer, the activity planning app I built for my family over the summer. It lets the kids browse local attractions, vote on where they want to go, collect passport stamps for places they've visited, and see this week's plan — all behind a family PIN on a tablet or phone.

Before I send you the setup link, I want to be transparent about how the app works and what data it holds.

**What the app stores:**
- An optional family name (you choose)
- Your admin password and the children's PIN (stored as secure hashes — I cannot read them)
- Your family's activity preferences, votes, passport stamps, and wishlists
- Any memberships you add (e.g., National Trust, Harewood House)

**What it does NOT store:**
- Your email address or phone number
- Your children's names (they type a name on their device when voting, but it stays on the device)
- Any photos of your family
- Payment details

**Where it's stored:**
Everything is on my home server. It doesn't go to any cloud provider or third party. Only you (via your PIN/password) and I (as the server operator) can access your family's data.

**Your rights:**
You can ask me to delete all your family's data at any time and I'll do it within 7 days. The full privacy policy is at [link to /{slug}/privacy].

**What I'm asking:**
Please reply to this email to confirm:
1. You've read the above (and optionally the full privacy policy)
2. You authorise your household members, including your children, to use the app
3. The ages of any children who will use it (this helps me understand GDPR obligations)

Once you reply, I'll send you the setup link. The whole setup takes about 5 minutes — you'll set an admin password, create a PIN for the kids, and pick activities from a list.

Any questions, just ask.

Richard

---

## Operator: What to Do With the Reply

1. Keep the email thread (this is your GDPR consent record for this family)
2. Note the children's ages — if any child is under 13, this is standard GDPR-K data; no special action needed for a private app, but note it
3. Send the setup link: `npm run family:create-setup-link --slug="[chosen-slug]"`
4. Record in the table below

---

## Consent Log

| Family slug | Parent name | Consent received date | Children ages | Notes |
|-------------|-------------|----------------------|---------------|-------|
| | | | | |
| | | | | |
| | | | | |

Keep this file updated as families are onboarded.
