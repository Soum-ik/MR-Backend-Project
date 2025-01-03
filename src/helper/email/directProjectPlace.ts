interface data {
  projectNumber: string;
  clientName: string;
  items: [];
}

export const directProjectPlace = (data: data) => {
  const { projectNumber, clientName, items } = data;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Email Sign-Up Confirmation</title>
    <style>
      * {
        margin: 0;
        box-sizing: border-box;
      }
      body {
        font-family:
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          'Segoe UI',
          Roboto,
          Oxygen,
          Ubuntu,
          Cantarell,
          'Open Sans',
          'Helvetica Neue',
          sans-serif;
        background-color: #f4f4f4;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 20px auto;
        padding: 40px 60px;
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      }
      .logo-box {
        margin-top: 15px;
        display: flex;
        justify-content: center;
      }
      .logo {
        width: 80px;
        margin: 0 auto;
      }
      .title {
        color: #333;
        text-align: center;
        margin-bottom: 15px;
        margin-top: 20px;
        font-size: 22px;
        font-weight: 500;
      }
      .divider {
        display: block;
        width: 25%;
        height: 2px;
        background: rgba(128, 128, 128, 0.3);
        margin: 30px auto;
      }
      p {
        color: #333;
      }
      .messageText {
        font-size: 14px;
        margin-bottom: 15px;
      }
      .verification-code {
        max-width: 400px;
        font-size: 24px;
        text-align: center;
        margin: 20px auto;
        padding: 10px;
        background-color: #f0f0f0;
        border: 1px solid #ccc;
        border-radius: 5px;
        letter-spacing: 7px;
        font-weight: 600;
      }
      .button {
        background-color: #1b8cdc;
        color: #fff;
        font-weight: 500;
        padding: 15px 20px;
        border-radius: 10px;
        display: inline-block;
        text-decoration: none;
        line-height: 1;
      }
      .social {
        list-style: none;
        margin: 40px 0 0;
        padding: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 15px;
      }
      .social a {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 1px solid #ccc;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .items-block {
        display: flex;
        flex-direction: column;
        border: 1px solid rgba(128, 128, 128, 0.3);
      }

      .items-heading-block {
        display: flex;
        align-items: center;
        font-weight: 600;
        flex-wrap: nowrap;
        width: 100%;
      }

      .items-content-block {
        display: flex;
        align-items: stretch;
        flex-wrap: nowrap;
        width: 100%;
      }

      .heading-1 {
        flex-grow: 1;
        flex-shrink: 0;
        border-bottom: 1px solid rgba(128, 128, 128, 0.3);
        padding: 12px;
      }

      .items-content-block > .heading-1 {
        flex-shrink: 1;
      }

      .heading-1 > h1 {
        font-size: 16px;
        font-weight: 600;
        width: 100%;
        text-wrap: wrap;
      }

      .heading-1 > p {
        color: rgba(0, 0, 0, 0.8);
      }

      .heading-2,
      .heading-3,
      .heading-4 {
        width: 17%;
        flex-shrink: 0;
        border-bottom: 1px solid rgba(128, 128, 128, 0.3);
        border-left: 1px solid rgba(128, 128, 128, 0.3);
        padding: 12px;
        text-align: center;
      }

      .items-content-block > .heading-2,
      .items-content-block > .heading-3,
      .items-content-block > .heading-4 {
        font-weight: 500;
      }

      .bullet-dots-block {
        list-style: none;
        border-bottom: 1px solid rgba(128, 128, 128, 0.3);
        padding: 16px 12px;
      }

      .dots-item {
        margin-block: 4px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .dots-item > span {
        display: flex;
        font-size: 10px;
        color: white;
        align-items: center;
        justify-content: center;
        height: 16px;
        width: 16px;
        background-color: #1b8cdc;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .extra-delivery,
      .total-price-block {
        display: flex;
        align-items: center;
        border-bottom: 1px solid rgba(128, 128, 128, 0.3);
      }

      .extra-delivery-text,
      .total-price-text {
        flex-grow: 1;
        flex-shrink: 0;
        padding: 12px;
      }

      .total-price-block {
        border: none;
      }

      .total-price-text {
        font-weight: 600;
      }

      .extra-delivery-price,
      .total-price {
        width: 17%;
        flex-shrink: 0;
        padding: 12px;
        text-align: center;
      }

      .total-price {
        font-weight: 600;
      }

      @media only screen and (max-width: 600px) {
        .container {
          padding: 10px;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="logo-box">
        <img
          class="logo"
          src="https://mr-backend.s3.amazonaws.com/MR+Logo+Black.png"
          alt="MR Logo"
        />
      </div>
      <h2 class="title">You've received a project from ${clientName}</h2>
      <span class="divider"></span>
      <p class="messageText">Project #${projectNumber}</p>
      <!-- replace with items data -->
      <div class="items-block">
        <div class="items-heading-block">
          <div class="heading-1">Item</div>
          <div class="heading-2">Qty</div>
          <div class="heading-3">Dur</div>
          <div class="heading-4">Price</div>
        </div>
        <div class="items-content-block">
          <div class="heading-1">
            <h1>Door Hanger Design</h1>
            <p>Double sided design</p>
          </div>
          <div class="heading-2">1</div>
          <div class="heading-3">2 days</div>
          <div class="heading-4">$40</div>
        </div>
        <ul class="bullet-dots-block">
          <li class="dots-item"><span>&#x2714;</span> Unlimited Revisions</li>
          <li class="dots-item"><span>&#x2714;</span> PSD Source File</li>
          <li class="dots-item">
            <span>&#x2714;</span> Print Ready PDF or JPEG File
          </li>
        </ul>
        <div class="extra-delivery">
          <div class="extra-delivery-text">Extra-fast 1-day delivery</div>
          <div class="extra-delivery-price">$10</div>
        </div>
        <div class="total-price-block">
          <div class="total-price-text">Total</div>
          <div class="total-price">$50</div>
        </div>
      </div>
      <div style="text-align: center; margin-top: 20px">
        <a href="https://mahfujurrahm535.com/order/${projectNumber}" class="button">Take a look</a>
      </div>
      <ul class="social">
        <li>
          <a href="https://facebook.com/mahfuj535">
            <img
              src="https://mr-backend.s3.ap-south-1.amazonaws.com/icons/81341.png"
              alt=""
              style="height: 16px"
            />
          </a>
        </li>
        <li>
          <a href="https://www.instagram.com/mahfujurrahm535">
            <img
              src="https://mr-backend.s3.ap-south-1.amazonaws.com/icons/instagram-53.png"
              alt=""
              style="height: 16px"
            />
          </a>
        </li>
        <li>
          <a href="https://x.com/mahfujurrahm535">
            <img
              src="https://mr-backend.s3.ap-south-1.amazonaws.com/icons/x-social-media-black-icon.png"
              alt=""
              style="height: 16px"
            />
          </a>
        </li>
        <li>
          <a href="https://www.pinterest.com/mahfujurrahm535">
            <img
              src="https://mr-backend.s3.ap-south-1.amazonaws.com/icons/black-pinterest-icon.png"
              alt=""
              style="height: 20px"
            />
          </a>
        </li>
        <li>
          <a href="https://www.linkedin.com/in/mahfujurrahm535">
            <img
              src="https://mr-backend.s3.ap-south-1.amazonaws.com/icons/free-linkedin-icon-130-thumb.png"
              alt=""
              style="height: 16px"
            />
          </a>
        </li>
      </ul>
    </div>
  </body>
</html>
`;
};
