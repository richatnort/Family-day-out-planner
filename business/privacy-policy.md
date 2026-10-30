# Days Out in Summer — Privacy Policy

**Version:** 1.0  
**Effective from:** on acceptance during family onboarding  
**Operator:** Richard Atha (richard@athafamily.com)

---

## What this app is

Days Out in Summer is a private, self-hosted family activity planning app. It is not a commercial product and is not publicly available. Access is by invitation only.

---

## What data we collect and why

| Data | Why we collect it | Required? |
|------|-------------------|-----------|
| **Family name** (e.g., "Jones Family") | To label your family's account | No — you can leave it blank |
| **Admin password (hashed)** | To let the parent/guardian log into the admin panel | Yes |
| **Child PIN (hashed)** | To let children access their activity list | Yes |
| **Activity preferences** | Which activities you add, edit, or deactivate | Yes — core feature |
| **Vote records** | Which activities your family votes on (emoji only, no names stored in DB) | Yes — core feature |
| **Passport stamps** | Dates and notes from activities you have visited | Yes — core feature |
| **Wishlist items** | Activities your family has hearted | Yes — core feature |
| **Membership details** | Your family's memberships (e.g., National Trust) and their expiry dates | No — optional feature |

**What we do NOT collect:**
- Email addresses (unless you choose to give one to the operator for support)
- Children's names (voter names are stored in your device's local storage only, not our database)
- Children's dates of birth
- Photos of your family
- Payment information
- Location data beyond the postcodes of venues on the activity list

---

## Where your data is stored

All data is stored on a private home server (Proxmox, running in the operator's home). It is not stored in any public cloud service. The server is accessible via a Cloudflare tunnel for external access, but your data never leaves the operator's server.

---

## Who can see your data

- **Your family:** all members who know the family PIN or admin password
- **The operator (Richard Atha):** has full access to the server and database for maintenance and support purposes
- **No one else:** your data is not shared with any third party, sold, or used for advertising

---

## How long we keep your data

We keep your data for as long as your family is using the app. If you ask us to delete your data, we will do so within **7 days** (see below).

We do not automatically delete inactive accounts.

---

## Your rights

You have the right to:

- **Access your data** — ask the operator to tell you what data is stored for your family
- **Correct your data** — the admin panel lets you edit activities, memberships, and stamps at any time
- **Delete your data** — ask the operator to delete everything associated with your family account. We will confirm deletion within 7 days with a count of records removed.
- **Object to processing** — if you no longer wish to use the app, ask for deletion and we will stop processing your data

To exercise any of these rights, contact the operator at **richard@athafamily.com**.

---

## Children's data

This app is designed to be used by children with their parents' knowledge and consent. By signing up, the parent or guardian confirms they authorise their household members (including children) to use the app.

We minimise children's data:
- No child names are stored in our database
- No child profiles exist
- Voting is identified by a name the child types on their own device — this is stored only in their browser, not our server

If you are a parent whose child's data is held in this app and you wish to exercise the right to erasure, contact the operator.

---

## Security

- Passwords and PINs are stored as bcrypt hashes (≥12 rounds). We cannot recover your PIN or password — only reset it.
- All cookies are HttpOnly, SameSite=Strict, and scoped to your family's URL path.
- Rate limiting prevents brute-force attacks on PINs and admin passwords.
- The server is not publicly advertised and access is by invitation only.

No security system is perfect. If you believe your family's account has been compromised, contact the operator immediately.

---

## Changes to this policy

If we make changes to this policy, we will notify each family by email (if provided) or by displaying a notice on the app's login screen. Continued use of the app after notification constitutes acceptance.

---

## Contact

**Richard Atha**  
richard@athafamily.com
