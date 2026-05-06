import type { EmailData, FeatureCard, FIItem } from './types';

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(str: string): string {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function nl2br(str: string): string {
  return esc(str).replace(/\n/g, '<br>');
}

function formatMonthYear(monthYear: string): string {
  if (!monthYear) return '';
  const [year, month] = monthYear.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function spacer(px: number): string {
  return `<tr><td style="height:${px}px;font-size:1px;line-height:1px">&nbsp;</td></tr>`;
}

function hr(): string {
  return `<tr>
            <td style="padding:0 32px" class="mobile-pad">
              <div style="height:1px;background-color:#E3E2DB;font-size:1px;line-height:1px">&nbsp;</div>
            </td>
          </tr>`;
}

function cardDivider(): string {
  return `${spacer(48)}
          ${hr()}
          ${spacer(40)}`;
}

function extractYoutubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function getThumbnailSrc(card: FeatureCard): string | null {
  if (!card.videoUrl.trim()) return null;
  if (!(card.isNonYoutube ?? false)) {
    const id = extractYoutubeId(card.videoUrl);
    return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : null;
  }
  return (card.thumbnailUrl ?? '').trim() || null;
}

function videoBlock(card: FeatureCard): string {
  const thumbSrc = getThumbnailSrc(card);
  if (!thumbSrc) return '';
  const height = card.videoHeight ?? 200;
  return `<tr>
                  <td>
                    <a href="${escAttr(card.videoUrl)}" target="_blank" style="display:block;text-decoration:none">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#042717;border-radius:4px 4px 0 0">
                        <tr>
                          <td align="center" valign="middle" style="background-image:url('${escAttr(thumbSrc)}');background-size:cover;background-position:center center;height:${height}px;font-size:0;line-height:0;border-radius:4px 4px 0 0">
                            <!--[if !mso]><!-->
                            <div style="width:56px;height:56px;border-radius:50%;background-color:#007A5A;display:inline-block;line-height:56px;text-align:center">
                              <span style="color:#ffffff;font-size:20px;margin-left:3px">&#9654;</span>
                            </div>
                            <!--<![endif]-->
                          </td>
                        </tr>
                      </table>
                    </a>
                  </td>
                </tr>`;
}

function ctaButtonRow(ctaText: string, ctaUrl: string): string {
  if (!ctaText.trim() || !ctaUrl.trim()) {
    return `<tr><td style="height:28px;font-size:1px;line-height:1px">&nbsp;</td></tr>`;
  }
  return `<tr>
                  <td style="padding:20px 28px 28px 28px">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="border:1px solid #007A5A;border-radius:2px">
                          <a href="${escAttr(ctaUrl)}" target="_blank" style="display:block;padding:12px 24px;font-family:'Geist',-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:600;color:#007A5A;text-decoration:none;letter-spacing:-0.01em;text-align:center">${esc(ctaText)}&ensp;&rarr;</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>`;
}

function featureCardHtml(card: FeatureCard): string {
  return `<tr>
            <td style="padding:0 32px" class="mobile-pad">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border:1px solid #E3E2DB;border-radius:4px">
                ${videoBlock(card)}
                <tr>
                  <td style="padding:22px 28px 0 28px">
                    <span style="font-family:'Geist Mono','SFMono-Regular','Cascadia Mono','Courier New',monospace;font-size:12px;letter-spacing:0.02em;color:#007A5A;text-transform:uppercase;font-weight:600">${esc(card.tag)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 28px 0 28px">
                    <div style="font-family:'Hedvig Letters Serif',Georgia,'Times New Roman',serif;font-size:24px;line-height:1.4;color:#131316;font-weight:400;letter-spacing:-0.01em" class="mobile-feat-title">
                      ${nl2br(card.title)}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 28px 0 28px">
                    <div style="font-size:16px;line-height:1.6;color:#3f3f46">
                      ${nl2br(card.description)}
                    </div>
                  </td>
                </tr>
                ${ctaButtonRow(card.ctaText, card.ctaUrl)}
              </table>
            </td>
          </tr>`;
}

function fiItemHtml(item: FIItem, isFirst: boolean): string {
  const topPad = isFirst ? '12px' : '8px';
  return `<tr>
                  <td style="padding:${topPad} 0 0 0">
                    <div style="font-size:16px;line-height:1.8;color:#3f3f46">
                      <span style="color:#007A5A;font-size:8px;vertical-align:middle;padding-right:8px">&#9679;</span><span style="font-weight:600;color:#131316">${esc(item.title)}</span> &mdash; ${esc(item.description)}
                    </div>
                  </td>
                </tr>`;
}

function fiSectionHtml(fiItems: FIItem[]): string {
  if (fiItems.length === 0) return '';
  return `<tr>
            <td style="padding:0 32px" class="mobile-pad">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:0 0 0 0">
                    <span style="font-family:'Geist Mono','SFMono-Regular','Cascadia Mono','Courier New',monospace;font-size:11px;letter-spacing:0.02em;color:#007A5A;text-transform:uppercase;font-weight:600">Features &amp; Improvements</span>
                  </td>
                </tr>
                ${fiItems.map((item, i) => fiItemHtml(item, i === 0)).join('\n')}
                <tr><td style="height:16px;font-size:1px;line-height:1px">&nbsp;</td></tr>
              </table>
            </td>
          </tr>`;
}

export function generateHtml(data: EmailData): string {
  const updateCount = data.featureCards.length + data.fiItems.length;
  const currentYear = new Date().getFullYear();
  const displayMonth = formatMonthYear(data.monthYear);

  const cardsHtml = data.featureCards.length > 0
    ? data.featureCards.map(c => featureCardHtml(c)).join(`\n${cardDivider()}\n`) + `\n${cardDivider()}`
    : '';

  const fiHtml = fiSectionHtml(data.fiItems);

  // dot pattern SVG for CTA background
  const dotPattern = `data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='0.8' fill='%23007A5A' opacity='0.12'/%3E%3C/svg%3E`;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <title>DoubleTick Product Updates &ndash; ${esc(displayMonth)}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <style>table{border-collapse:collapse;}td{font-family:Arial,sans-serif;}</style>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Hedvig+Letters+Serif&display=swap');
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    table,td{mso-table-lspace:0;mso-table-rspace:0}
    img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none}
    body{height:100%!important;margin:0!important;padding:0!important;width:100%!important}
    a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important}
    @media only screen and (max-width:620px){
      .mobile-full{width:100%!important;max-width:100%!important}
      .mobile-pad{padding-left:20px!important;padding-right:20px!important}
      .mobile-hide{display:none!important}
      .mobile-headline{font-size:28px!important;line-height:36px!important}
      .mobile-feat-title{font-size:22px!important;line-height:30px!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#F4F3EC;font-family:'Geist',-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased">

  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:#F4F3EC;line-height:1px">
    ${esc(data.preheader)}
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F4F3EC">
    <tr>
      <td align="center" style="padding:40px 16px 56px 16px">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%" class="mobile-full">

          <!-- HEADER -->
          <tr>
            <td style="padding:0 32px 24px 32px" class="mobile-pad">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="line-height:0">
                    <img src="https://quicksell-static-staging-2.s3.ap-south-1.amazonaws.com/logo.png" width="130" style="display:block;border:0;outline:none;text-decoration:none;height:auto" alt="DoubleTick">
                  </td>
                  <td align="right" valign="middle">
                    <span style="font-family:'Geist Mono','SFMono-Regular','Cascadia Mono','Courier New',monospace;font-size:12px;letter-spacing:0.02em;color:#007A5A;text-transform:uppercase;font-weight:600">Product Updates</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${hr()}

          <!-- HERO INTRO -->
          <tr>
            <td style="padding:40px 32px 0 32px" class="mobile-pad">
              <span style="font-family:'Geist Mono','SFMono-Regular','Cascadia Mono','Courier New',monospace;font-size:13px;letter-spacing:0.02em;color:#007A5A;text-transform:uppercase;font-weight:600">${esc(displayMonth)} &middot; ${updateCount} Update${updateCount !== 1 ? 's' : ''}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 32px 0 32px" class="mobile-pad">
              <div style="font-family:'Hedvig Letters Serif',Georgia,'Times New Roman',serif;font-size:34px;line-height:1.3;color:#131316;font-weight:400;letter-spacing:-0.01em" class="mobile-headline">
                ${nl2br(data.heroHeadline)}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 32px 0 32px" class="mobile-pad">
              <span style="font-size:16px;line-height:1.6;color:#3f3f46">${nl2br(data.heroSubtext)}</span>
            </td>
          </tr>

          ${spacer(40)}

          <!-- FEATURE CARDS -->
          ${cardsHtml}

          <!-- FEATURES & IMPROVEMENTS -->
          ${fiHtml}

          ${spacer(56)}

          <!-- CTA SECTION -->
          <tr>
            <td style="padding:0 32px" class="mobile-pad">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border:1px solid #E3E2DB;border-radius:4px;background-image:url(&quot;${dotPattern}&quot;);background-repeat:repeat">
                <tr>
                  <td align="center" style="padding:40px 28px 0 28px">
                    <div style="font-family:'Hedvig Letters Serif',Georgia,'Times New Roman',serif;font-size:24px;line-height:1.4;color:#131316;font-weight:400;letter-spacing:-0.01em;text-align:center">
                      ${nl2br(data.ctaHeadline)}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:24px 28px 40px 28px">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color:#007A5A;border-radius:2px">
                          <a href="https://web.doubletick.io" target="_blank" style="display:inline-block;padding:12px 36px;font-family:'Geist',-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.01em">Open DoubleTick&ensp;&rarr;</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${spacer(56)}

          <!-- FOOTER -->
          ${hr()}
          <tr>
            <td style="padding:20px 32px 0 32px" class="mobile-pad">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <span style="font-family:'Geist Mono','SFMono-Regular','Cascadia Mono','Courier New',monospace;font-size:11px;letter-spacing:0.02em;color:#70707b">&copy; ${currentYear} DoubleTick</span>
                  </td>
                  <td align="right">
                    <a href="#" target="_blank" style="font-family:'Geist Mono','SFMono-Regular','Cascadia Mono','Courier New',monospace;font-size:11px;letter-spacing:0.02em;color:#70707b;text-decoration:none">Unsubscribe</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr><td style="height:8px;font-size:1px;line-height:1px">&nbsp;</td></tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}
