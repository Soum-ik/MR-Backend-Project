interface ItemObject {
  text: string;
  duration: number;
  price?: number;
  isExtend?: boolean;
}

interface data {
  projectNumber?: string;
  clientName: string;
  item?: ItemObject;
}

export const emailTemplate = (data: data) => {
  const { projectNumber, clientName, item } = data;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Email Sign-Up Confirmation</title>
    <style>
      body {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
          Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue",
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
        margin: 40px 0 0;
        padding: 0;
        text-align: center;
      }
      .social a {
        display: inline-block;
        margin-left: 3px;
        margin-right: 3px;
      }
      .social a img {
        width: 30px;
      }

      @media only screen and (max-width: 600px) {
        .container {
          padding: 10px;
        }
      }
    </style>
  </head>
  <body>
  <table
      border="0"
      align="center"
      width="600"
      cellspacing="0"
      cellpadding="0"
    >
      <tr>
        <td>
    <div class="container">
      <div class="logo-box">
        <img
          class="logo"
          src="https://mr-backend.s3.amazonaws.com/mr-backend-files-1737653981685-394446378.png"
          alt="MR Logo"
        />
      </div>
      <h2 class="title">Your ${item?.isExtend ? `extend request` : `offer`} has been accepted</h2>
      <span class="divider"></span>
      <p class="messageText">
        ${clientName} has accepted your ${item?.isExtend ? `extend request` : `offer`} on project #${projectNumber}
      </p>

      <table
        border="1"
        style="width: 100%; border-color: rgba(128, 128, 128, 0.3)"
        cellspacing="0"
        cellpadding="10"
      >
        <thead>
          <tr>
            <th style="width: ${item?.price ? 66 : 83}%; border: none; text-align: left">Item</th>
            <th style="width: 17%; border-top: none; border-bottom: none">
              Dur
            </th>
            ${item?.price ? `<th style="width: 17%; border: none">Price</th>` : ``}
          </tr>
        </thead>
        <tbody>
          <tr style="vertical-align: top">
            <td
              style="
                width: ${item?.price ? 66 : 83}%;
                border: none;
                border-top: 1px solid rgba(128, 128, 128, 0.3);
              "
            >
              <h1 style="font-size: 16px; font-weight: 400; margin: 0;">
                ${item?.text}
              </h1>
            </td>
            <td
              style="
                width: 17%;
                border-bottom: none;
                text-align: center;
                font-weight: 500;
              "
            >
              ${item?.duration} ${item?.duration && item?.duration > 1 ? 'days' : 'day'}
            </td>
            ${
              item?.price
                ? `<td
              style="
                width: 17%;
                border: none;
                border-top: 1px solid rgba(128, 128, 128, 0.3);
                text-align: center;
                font-weight: 500;
              "
            >
              $${item?.price}
            </td>`
                : ``
            }
          </tr>
        </tbody>
        ${
          item?.price
            ? `<tfoot>
          <tr>
            <td
              colspan="2"
              style="
                width: 83%;
                border: none;
                border-top: 1px solid rgba(128, 128, 128, 0.3);
                font-weight: 500;
              "
            >
              Total
            </td>
            <td
              style="
                width: 17%;
                border: none;
                border-top: 1px solid rgba(128, 128, 128, 0.3);
                text-align: center;
                font-weight: 500;
              "
            >
              $${item?.price}
            </td>
          </tr>
        </tfoot>`
            : ``
        }
      </table>

      <div style="text-align: center; margin-top: 20px">
        <a href="https://mahfujurrahm535.com/order/${projectNumber}" class="button" style="color: #ffffff!important;">View project</a>
      </div>
      <div class="social">
              <a href="https://facebook.com/mahfuj535">
                <img
                  src="https://mr-backend.s3.amazonaws.com/mr-backend-files-1738250979804-274966243.png"
                  alt=""
                />
              </a>
              <a href="https://www.instagram.com/mahfujurrahm535">
                <img
                  src="https://mr-backend.s3.amazonaws.com/mr-backend-files-1738251041263-299717143.png"
                  alt=""
                />
              </a>
              <a href="https://x.com/mahfujurrahm535">
                <img
                  src="https://mr-backend.s3.amazonaws.com/mr-backend-files-1738251171481-608690311.png"
                  alt=""
                />
              </a>
              <a href="https://www.pinterest.com/mahfujurrahm535">
                <img
                  src="https://mr-backend.s3.amazonaws.com/mr-backend-files-1738251135480-267640083.png"
                  alt=""
                />
              </a>
              <a href="https://www.linkedin.com/in/mahfujurrahm535">
                <img
                  src="https://mr-backend.s3.amazonaws.com/mr-backend-files-1738251090221-711258380.png"
                  alt=""
                />
              </a>
            </div>
    </div>
    </td>
      </tr>
    </table>
  </body>
</html>
`;
};
