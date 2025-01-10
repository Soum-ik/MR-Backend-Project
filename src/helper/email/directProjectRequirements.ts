interface data {
  projectNumber: string;
  clientName: string;
  items: [];
  requirements: [];
  orderCreateDate: Date;
}

export const directProjectRequirements = (data: data) => {
  const { projectNumber, clientName, items, requirements, orderCreateDate } =
    data;

  function dateTimeFormatter(timestamp: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true, // 12-hour format
    };

    const formatter = new Intl.DateTimeFormat('en-US', options);
    return formatter.format(timestamp);
  }

  return `<!DOCTYPE html>
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
        list-style: none;
        margin: 40px 0 0;
        padding: 0;
        text-align: center;
      }
      .social li {
        display: inline-block;
        margin-left: 3px;
        margin-right: 3px;
      }
      .social a {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 1px solid #ccc;
        line-height: 28px;
        display: inline-block;
      }

      .requirements-block {
        list-style: none;
        padding-left: 0;
      }
      .requirement {
        margin-top: 20px;
      }
      .requirement > span {
        display: inline-block;
        width: 3%;
        color: #1b8cdc;
        font-weight: 600;
        vertical-align: top;
      }
      .requirement > div {
        display: inline-block;
        width: 95%;
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
      <p class="messageText">
        <span style="font-weight: 500">Project #${projectNumber}</span> is due ${dateTimeFormatter(orderCreateDate)}.
      </p>
      <table
        border="1"
        style="width: 100%; border-color: rgba(128, 128, 128, 0.3)"
        cellspacing="0"
        cellpadding="10"
      >
        <thead>
          <tr>
            <th style="width: 49%; border: none; text-align: left">Item</th>
            <th
              style="
                width: 17%;
                border: none;
                border-left: 1px solid rgba(128, 128, 128, 0.3);
              "
            >
              Qty
            </th>
            <th style="width: 17%; border-top: none; border-bottom: none">
              Dur
            </th>
            <th style="width: 17%; border: none">Price</th>
          </tr>
        </thead>
        <tbody>
          <tr style="vertical-align: top">
            <td
              style="
                width: 49%;
                border: none;
                border-top: 1px solid rgba(128, 128, 128, 0.3);
              "
            >
              <h1 style="font-size: 16px; font-weight: 600">
                Door Hanger Design
              </h1>
              <p style="color: rgba(0, 0, 0, 0.8)">Double sided design</p>
            </td>
            <td
              style="
                width: 17%;
                border-bottom: none;
                border-right: none;
                text-align: center;
                font-weight: 500;
              "
            >
              1
            </td>
            <td
              style="
                width: 17%;
                border-bottom: none;
                text-align: center;
                font-weight: 500;
              "
            >
              2 days
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
              $40
            </td>
          </tr>
          <tr>
            <td
              colspan="4"
              style="
                width: 83%;
                border: none;
                border-top: 1px solid rgba(128, 128, 128, 0.3);
              "
            >
              <ul style="list-style: none; padding-left: 0">
                <li>
                  <span
                    style="
                      display: inline-block;
                      height: 16px;
                      width: 16px;
                      line-height: 16px;
                      font-size: 10px;
                      text-align: center;
                      border-radius: 50%;
                      background-color: #1b8cdc;
                      color: #fff;
                      margin-right: 5px;
                    "
                    >&#x2714;</span
                  >
                  Unlimited Revisions
                </li>
                <li>
                  <span
                    style="
                      display: inline-block;
                      height: 16px;
                      width: 16px;
                      line-height: 16px;
                      font-size: 10px;
                      text-align: center;
                      border-radius: 50%;
                      background-color: #1b8cdc;
                      color: #fff;
                      margin-right: 5px;
                    "
                    >&#x2714;</span
                  >
                  PSD Source File
                </li>
                <li>
                  <span
                    style="
                      display: inline-block;
                      height: 16px;
                      width: 16px;
                      line-height: 16px;
                      font-size: 10px;
                      text-align: center;
                      border-radius: 50%;
                      background-color: #1b8cdc;
                      color: #fff;
                      margin-right: 5px;
                    "
                    >&#x2714;</span
                  >
                  Print Ready PDF or JPEG File
                </li>
              </ul>
            </td>
          </tr>
          <tr>
            <td
              colspan="3"
              style="
                width: 83%;
                border: none;
                border-top: 1px solid rgba(128, 128, 128, 0.3);
              "
            >
              Extra-fast 1-day delivery
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
              $10
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td
              colspan="3"
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
              $50
            </td>
          </tr>
        </tfoot>
      </table>

      <div style="margin-top: 20px">
        The buyer has provided the following project requirements:
      </div>

      <ul class="requirements-block">
        <li class="requirement">
          <span>1.</span>
          <div>
            <p style="margin-bottom: 5px">Which industry do you work in?</p>
            <p>Pest control and bed maintenance</p>
          </div>
        </li>
        <li class="requirement">
          <span>2.</span>
          <div>
            <p style="margin-bottom: 5px">Do you have your own/company logo?</p>
            <p>use one of these or a combination for the aeration image.</p>
            <span style="display: block; margin-top: 5px"
              >[2 files attached]</span
            >
          </div>
        </li>
        <li class="requirement">
          <span>3.</span>
          <div>
            <p style="margin-bottom: 5px">
              Do you have your own/company website?
            </p>
            <p>www.website.com</p>
          </div>
        </li>
        <li class="requirement">
          <span>4.</span>
          <div>
            <p style="margin-bottom: 5px">
              Do you have any imaginary or specific design ideas?
            </p>
            <p>please use this image for fertilizing add</p>
            <span style="display: block; margin-top: 5px"
              >[1 files attached]</span
            >
          </div>
        </li>
        <li class="requirement">
          <span>5.</span>
          <div>
            <p style="margin-bottom: 5px">
              Do you have your specific design size?
            </p>
            <p>4.5x11 inch</p>
          </div>
        </li>
        <li class="requirement">
          <span>6.</span>
          <div>
            <p style="margin-bottom: 5px">
              You have to give clear information that you need in the design.
              (For example, all texts, all photos, logo, contact info, etc.)
            </p>
            <p>
              please use a combination of these for pest control and bed
              maintenance ads
            </p>
            <span style="display: block; margin-top: 5px"
              >[5 files attached]</span
            >
          </div>
        </li>
      </ul>

      <div style="text-align: center; margin-top: 30px">
        <span
          style="
            display: block;
            width: 100%;
            background-color: rgba(128, 128, 128, 0.3);
            height: 2px;
          "
        ></span>
        <p style="margin-block: 15px">Got everything you need?</p>
        <a href="https://mahfujurrahm535.com/order/${projectNumber}" class="button">Review Requirements</a>
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
