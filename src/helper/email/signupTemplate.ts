export const signupTemplate = (clientName: string) => {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Email Sign-Up Confirmation</title>
    <style>
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
      <h2 class="title">Welcome!</h2>
      <span class="divider"></span>
      <p class="messageText">Thank you for sign up with <b>Mahfujurrahm535</b>. We hope you enjoy your time with us. Check your account and update your profile.
      </p>
      <div style="text-align: center">
        <a href="https://mahfujurrahm535.com/${clientName}" class="button" style="color: #ffffff!important;">My Account</a>
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
