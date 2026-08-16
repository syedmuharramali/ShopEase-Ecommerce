const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const AJK = '  "Azad Jammu & Kashmir",';

const targets = [
  "backend/models/productDeliveryRate.model.js",
  "backend/controllers/order.controller.js",
  "frontend/src/pages/AdminProductForm.jsx",
  "frontend/src/pages/OrderPage.jsx",
];

function addAjkToCanonicalRegionList(relativePath) {
  const filePath = path.join(ROOT, relativePath);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing file: ${relativePath}`);
  }

  const original = fs.readFileSync(filePath, "utf8");

  if (original.includes('"Azad Jammu & Kashmir"')) {
    console.log(`✓ ${relativePath} already includes AJK`);
    return false;
  }

  const pattern = /(\s*"Gilgit-Baltistan",\r?\n\s*"Islamabad Capital Territory",)/;

  if (!pattern.test(original)) {
    throw new Error(
      `Could not find the canonical delivery-region list in ${relativePath}`
    );
  }

  const updated = original.replace(
    pattern,
    (match) => `${match}\n${AJK}`
  );

  fs.writeFileSync(filePath, updated, "utf8");
  console.log(`✓ Added AJK to ${relativePath}`);
  return true;
}

try {
  let changed = 0;

  for (const target of targets) {
    if (addAjkToCanonicalRegionList(target)) changed += 1;
  }

  const orderModelPath = path.join(ROOT, "backend/models/order.model.js");
  const orderModel = fs.readFileSync(orderModelPath, "utf8");

  if (!orderModel.includes('"Azad Jammu & Kashmir"')) {
    throw new Error(
      "backend/models/order.model.js does not contain the canonical AJK value. Stop and fix the order schema before continuing."
    );
  }

  console.log("");
  console.log(
    changed > 0
      ? `Done. Updated ${changed} delivery-region file(s).`
      : "Done. Delivery-region files were already normalized."
  );
  console.log("");
  console.log("Canonical ShopEase delivery regions are now:");
  console.log("- Punjab");
  console.log("- Sindh");
  console.log("- Khyber Pakhtunkhwa");
  console.log("- Balochistan");
  console.log("- Gilgit-Baltistan");
  console.log("- Islamabad Capital Territory");
  console.log("- Azad Jammu & Kashmir");
  console.log("");
  console.log("Restart the backend after running this script.");
} catch (error) {
  console.error(`\nAJK delivery normalization failed: ${error.message}`);
  process.exit(1);
}
