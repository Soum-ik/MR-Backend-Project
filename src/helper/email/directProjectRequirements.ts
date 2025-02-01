interface ReqObject {
  question?: string;
  answer?: string;
  attachments: [];
}

interface Category {
  categoryName?: string;
}

interface SubCategory {
  subTitle?: string;
}

interface FreeSubDesign {
  subDesignName: string;
  isSelected: boolean;
}

interface FreeDesign {
  designName: string;
  freeSubDesign: FreeSubDesign;
}

interface DesignSubObject {
  subCategoryLabel: string;
}

interface DesignObject {
  categoryLabel: string;
  subCategory: DesignSubObject;
}

interface ItemObject {
  category?: Category;
  categoryName?: string;
  image?: object;
  bulletPoint?: [];
  subCategory?: string | SubCategory;
  selectedQuantity?: number;
  quantity?: number;
  title?: string;
  deliveryDuration: number;
  isFastDelivery: boolean;
  fastDeliveryAmount: number | string;
  fastDeliveryDuration: number | string;
  subTotal?: number;
  totalAmount?: number;
  projectType?: string;
  projectImage?: string;
  from?: string;
  designTitle?: string;
  designId?: string;
  regularDeliveryDays: string;
  fastDeliveryDays: string;
  fastDeliveryPrice: string;
  desc?: string;
  deliveryWay?: string;
  durationHours: number;
  freeDesign?: FreeDesign;
  designs?: DesignObject[];
}

interface data {
  projectNumber: string;
  clientName: string;
  items?: ItemObject[];
  requirements?: ReqObject[];
  orderCreateDate: Date;
  totalPrice: string;
  from?: string;
}

export const directProjectRequirements = (data: data) => {
  const {
    projectNumber,
    clientName,
    items,
    requirements,
    orderCreateDate,
    totalPrice,
    from,
  } = data;

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

      .requirements-block {
        list-style: none;
        padding-left: 0;
      }
      .requirements-block *{
        margin: 0;
        padding: 0;
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
      <h2 class="title">You've received a project from ${clientName}</h2>
      <span class="divider"></span>
      <p class="messageText">
        <span style="font-weight: 500">Project #${projectNumber}</span> is due ${dateTimeFormatter(orderCreateDate)}.
      </p>
      ${
        from === 'offerProject'
          ? `<table
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
        ${items
          ?.map(
            ({
              isFastDelivery,
              fastDeliveryDuration,
              fastDeliveryAmount,
              bulletPoint,
              designs,
              freeDesign,
            }: ItemObject) => `
        ${
          freeDesign && freeDesign?.freeSubDesign?.isSelected
            ? `<tr style="vertical-align: top">
            <td
              style="
                width: 49%;
                border: none;
                border-top: 1px solid rgba(128, 128, 128, 0.3);
              "
            >
            ${
              freeDesign && freeDesign?.designName
                ? `<h1 style="font-size: 16px; font-weight: 600; margin: 0; color: #1b8cdc!important;">
                Free Design
              </h1>`
                : ``
            }
              ${
                freeDesign && freeDesign?.designName
                  ? `<h1 style="font-size: 16px; font-weight: 600; margin: 0;">
                ${freeDesign?.designName}
              </h1>`
                  : ``
              }
              ${freeDesign && freeDesign?.freeSubDesign?.subDesignName ? `<p style="color: rgba(0, 0, 0, 0.8); margin: 0;">${freeDesign?.freeSubDesign?.subDesignName}</p>` : ``}
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
              -
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
              -
            </td>
          </tr>`
            : ``
        }
        ${
          designs && designs?.length > 0
            ? `${designs
                ?.map(
                  ({
                    categoryLabel,
                    subCategory,
                  }: DesignObject) => `<tr style="vertical-align: top">
            <td
              style="
                width: 49%;
                border: none;
                border-top: 1px solid rgba(128, 128, 128, 0.3);
              "
            >
              ${
                categoryLabel
                  ? `<h1 style="font-size: 16px; font-weight: 600; margin: 0;">
                ${categoryLabel}
              </h1>`
                  : ``
              }
              ${subCategory?.subCategoryLabel ? `<p style="color: rgba(0, 0, 0, 0.8); margin: 0;">${subCategory?.subCategoryLabel}</p>` : ``}
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
              -
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
              -
            </td>
          </tr>`,
                )
                .join('')}`
            : ``
        }
          ${
            bulletPoint && bulletPoint?.length > 0
              ? `<tr>
            <td
              colspan="4"
              style="
                width: 83%;
                border: none;
                border-top: 1px solid rgba(128, 128, 128, 0.3);
              "
            >
              <ul style="list-style: none; padding-left: 0; margin: 0;">
                ${bulletPoint
                  ?.map(
                    (
                      bullet,
                    ) => `<li style="margin: 0; margin-top: 3px; margin-bottom: 3px;">
                  <img src="https://mr-backend.s3.amazonaws.com/mr-backend-files-1737654200988-435843765.png" alt="check icon" style="height: 16px; display: inline-block; border-radius: 50%; vertical-align: middle;" />
                  ${bullet}
                </li>`,
                  )
                  .join('')}
              </ul>
            </td>
          </tr>`
              : ``
          }
          
          ${
            isFastDelivery
              ? `<tr>
            <td
              colspan="3"
              style="
                width: 83%;
                border: none;
                border-top: 1px solid rgba(128, 128, 128, 0.3);
              "
            >
              Extra-fast ${fastDeliveryDuration}-${
                typeof fastDeliveryDuration === 'string' &&
                parseInt(fastDeliveryDuration) > 1
                  ? `days`
                  : `day`
              } delivery
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
              $${fastDeliveryAmount}
            </td>
          </tr>`
              : ``
          }
        `,
          )
          .join('')}
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
              $${items && items[0]?.totalAmount}
            </td>
          </tr>
        </tfoot>
      </table>`
          : `<table
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
        ${items
          ?.map(
            ({
              isFastDelivery,
              fastDeliveryDuration,
              fastDeliveryAmount,
              bulletPoint,
              subTotal,
              deliveryDuration,
              selectedQuantity,
              subCategory,
              categoryName,
              designId,
              designTitle,
              category,
              quantity,
              fastDeliveryPrice,
              fastDeliveryDays,
              regularDeliveryDays,
              title,
              desc,
              durationHours,
              deliveryWay,
            }: ItemObject) => `
        <tr style="vertical-align: top">
            <td
              style="
                width: 49%;
                border: none;
                border-top: 1px solid rgba(128, 128, 128, 0.3);
              "
            >
              ${
                designTitle && designId
                  ? `<a href="https://mahfujurrahm535.com/design/${designId}" style="font-size: 16px; font-weight: 500; color: #1b8cdc!important; margin: 0;">
                ${designTitle}
              </a>`
                  : ``
              }
              ${
                categoryName || category?.categoryName || title
                  ? `<h1 style="font-size: 16px; font-weight: 600; margin: 0;">
                ${categoryName || category?.categoryName || title}
              </h1>`
                  : ``
              }
              ${subCategory && typeof subCategory === 'string' ? `<p style="color: rgba(0, 0, 0, 0.8); margin: 0;">${subCategory}</p>` : typeof subCategory === 'object' && subCategory.subTitle ? `<p style="color: rgba(0, 0, 0, 0.8); margin: 0;">${subCategory.subTitle}</p>` : desc ? `<p style="color: rgba(0, 0, 0, 0.8); margin: 0;">${desc}</p>` : ``}
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
              ${selectedQuantity || quantity}
            </td>
            <td
              style="
                width: 17%;
                border-bottom: none;
                text-align: center;
                font-weight: 500;
              "
            >
              ${isFastDelivery ? fastDeliveryDuration || fastDeliveryDays : deliveryDuration || regularDeliveryDays || durationHours} ${isFastDelivery && ((typeof fastDeliveryDuration === 'number' && fastDeliveryDuration > 1) || parseInt(fastDeliveryDays) > 1) ? `days` : !isFastDelivery && (deliveryDuration > 1 || parseInt(regularDeliveryDays) > 1) ? `days` : deliveryWay === 'hours' && durationHours > 1 ? `hours` : deliveryWay === 'hours' && durationHours === 1 ? `hour` : `day`}
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
              $${subTotal}
            </td>
          </tr>
          ${
            bulletPoint && bulletPoint?.length > 0
              ? `<tr>
            <td
              colspan="4"
              style="
                width: 83%;
                border: none;
                border-top: 1px solid rgba(128, 128, 128, 0.3);
              "
            >
              <ul style="list-style: none; padding-left: 0; margin: 0;">
                ${bulletPoint
                  ?.map(
                    (
                      bullet,
                    ) => `<li style="margin: 0; margin-top: 3px; margin-bottom: 3px;">
                  <img src="https://mr-backend.s3.amazonaws.com/mr-backend-files-1737654200988-435843765.png" alt="check icon" style="height: 16px; display: inline-block; border-radius: 50%; vertical-align: middle;" />
                  ${bullet}
                </li>`,
                  )
                  .join('')}
              </ul>
            </td>
          </tr>`
              : ``
          }
          
          ${
            isFastDelivery
              ? `<tr>
            <td
              colspan="3"
              style="
                width: 83%;
                border: none;
                border-top: 1px solid rgba(128, 128, 128, 0.3);
              "
            >
              Extra-fast ${fastDeliveryDuration || fastDeliveryDays}-${(typeof fastDeliveryDuration === 'number' && fastDeliveryDuration > 1) || parseInt(fastDeliveryDays) > 1 ? `days` : `day`} delivery
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
              $${fastDeliveryAmount || fastDeliveryPrice}
            </td>
          </tr>`
              : ``
          }
        `,
          )
          .join('')}
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
              $${totalPrice || 0}
            </td>
          </tr>
        </tfoot>
      </table>`
      }

      <div style="margin-top: 20px">
        The buyer has provided the following project requirements:
      </div>

      <ul class="requirements-block">
        ${requirements
          ?.map(
            ({ question, answer, attachments }: ReqObject, i: number) => `
        <li class="requirement">
          <span>${i + 1}.</span>
          <div>
            <p style="margin-bottom: 5px">${question}</p>
            <p>${answer}</p>
            ${
              attachments.length > 0
                ? `<span style="display: block; margin-top: 5px"
              >[${attachments.length} ${attachments.length > 1 ? `files` : `file`} attached]</span
            >`
                : `<span style="display: none;"></span>`
            }
          </div>
        </li>
        `,
          )
          .join('')}
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
        <a href="https://mahfujurrahm535.com/order/${projectNumber}" class="button" style="color: #ffffff!important;">Review Requirements</a>
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
