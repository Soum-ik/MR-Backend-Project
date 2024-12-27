
interface CancelTemplateData {
  clientName: string;
  projectNumber: string;
  cancelDuration: string;
  buttonLink: string;
  logoUrl?: string;
  socialLinks?: {
    facebook: string;
    instagram: string;
    twitter: string;
    pinterest: string;
  };
}


const cancelTemplate = (data: CancelTemplateData): string => {
  const {
    clientName,
    projectNumber,
    cancelDuration,
    buttonLink,
    logoUrl = "https://mr-backend.s3.ap-south-1.amazonaws.com/MR+Logo+Icon.png",
    socialLinks = {
      facebook: "https://facebook.com/mahfuj535",
      instagram: "https://www.instagram.com/mahfujurrahm535",
      twitter: "https://x.com/mahfujurrahm535",
      pinterest: "https://www.pinterest.com/mahfujurrahm535",
    },
  } = data;

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Email Sign-Up Confirmation</title>
        <style>
          /* Add your CSS styles here */
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo-box">
            <img class="logo" src="${logoUrl}" alt="Logo" />
          </div>
          <h2 class="title">${clientName} has sent a cancellation request</h2>
          <span class="divider"></span>
          <p class="messageText">
            ${clientName} has requested to cancel project #${projectNumber}. Please review
            the request and respond within the next ${cancelDuration}, or the project will be
            automatically canceled.
          </p>
          <div style="text-align: center">
            <a href="${buttonLink}" class="button">View and Respond</a>
          </div>
          <ul class="social">
            <li>
              <a href="${socialLinks.facebook}">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
                  <!-- Facebook SVG Path -->
                </svg>
              </a>
            </li>
            <li>
              <a href="${socialLinks.instagram}">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
                  <!-- Instagram SVG Path -->
                </svg>
              </a>
            </li>
            <li>
              <a href="${socialLinks.twitter}">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <!-- Twitter SVG Path -->
                </svg>
              </a>
            </li>
            <li>
              <a href="${socialLinks.pinterest}">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
                  <!-- Pinterest SVG Path -->
                </svg>
              </a>
            </li>
          </ul>
        </div>
      </body>
    </html>
  `;
};
