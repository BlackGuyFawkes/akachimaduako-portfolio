AKACHIMADUAKO.COM PORTFOLIO

This folder is a complete static website package.

Recommended deployment:
1. Create a dedicated GitHub repository such as akachimaduako-portfolio.
2. Upload the contents of this folder to the repository root.
3. Deploy with Cloudflare Pages or GitHub Pages.
4. Point akachimaduako.com to the deployed site.

Important structure:
/                 Main personal portfolio
/soc/             SOC/security investigation portfolio
/pentesting/      Penetration testing portfolio
/resume/          Request resume form (no public PDF)
/assets/images/   Portrait, favicon, social share card
/assets/soc/      SOC screenshots
/assets/docs/     Investigation and pentest reports

NOVEMBER 2026: CYBERSECURITY-ONLY REBUILD
- Nav is About, SOC, Pentesting, Resume, Contact.
- /projects/ redirects to the homepage.
- /neonstudio/ and /neonstudio/privacy/ stay online (Google Play needs the privacy URL)
  but are unlinked and marked noindex.
- Old resume PDF URLs redirect to /resume/ (via _redirects on Cloudflare).
- SEO: robots.txt, sitemap.xml, canonical + Open Graph tags, Person JSON-LD,
  share image at assets/images/og-card.jpg.

RESUME FORM: ONE-TIME ACTIVATION
The form posts through FormSubmit (formsubmit.co) to the Gmail address in the form's
action attribute. The first submission sends an activation email to that inbox.
Click the link once; after that every request is delivered. Optionally, replace the
address in resume/index.html with the random alias FormSubmit gives you after activation.


PENTESTING PAGE
- pentesting/index.html
- CTF report PDFs are under assets/docs/
- Selected report evidence images are under assets/pentesting/


CLEAN PUBLIC ROUTES AFTER DEPLOYMENT
------------------------------------
Main site:    https://akachimaduako.com/
SOC:          https://akachimaduako.com/SOC/
Pentesting:   https://akachimaduako.com/pentesting/

Note: when opened directly from Windows with file://, the browser will still show a local
C:\ path. The short akachimaduako.com URLs appear after the site is deployed to the custom domain.


LOCAL PREVIEW FIX
-----------------
The site now automatically rewrites clean folder links to explicit index.html files
only when opened with file:// on Windows. Online, the URLs stay clean:

  https://akachimaduako.com/SOC/
  https://akachimaduako.com/pentesting/


NEONSTUDIO ROUTES
-----------------
https://akachimaduako.com/neonstudio/
https://akachimaduako.com/neonstudio/privacy/

For Google Play listings, use:
https://akachimaduako.com/neonstudio/privacy/

UPDATE SCRIPT
-------------
Run .\update-portfolio.ps1 from the root of the local Git repository whenever
you want to commit and upload website changes.
