# 🛍️ ShopEase — Full-Stack MERN E-Commerce Platform

<p align="center">
  <b>A modern, responsive and production-oriented e-commerce web application built with the MERN stack.</b>
</p>

<p align="center">
  <a href="https://shopease-sage.vercel.app/">
    <img src="https://img.shields.io/badge/Live%20Demo-ShopEase-7C3AED?style=for-the-badge&logo=vercel&logoColor=white" />
  </a>
  <a href="https://github.com/syedmuharramali/ShopEase-Ecommerce">
    <img src="https://img.shields.io/badge/Source%20Code-GitHub-181717?style=for-the-badge&logo=github" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Redux-Toolkit-764ABC?logo=redux&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-24-339933?logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white" />
</p>

---

## 🌐 Live Demo

### [👉 Visit ShopEase](https://shopease-sage.vercel.app/)

ShopEase is my first fully deployed full-stack e-commerce application after progressing from smaller web-development projects to building a complete application with real customer and admin workflows.

---

## 📖 About The Project

**ShopEase** is a full-stack e-commerce platform built using the **MERN stack — MongoDB, Express.js, React.js and Node.js**.

The project goes beyond a basic product catalogue. It includes product variants, inventory management, regional delivery pricing, shopping cart and wishlist functionality, checkout, order tracking, reviews, coupons, analytics, payment workflows and a complete administration system.

It also includes a dedicated **supplier / dropshipping workflow** for managing external products and fulfillment information separately from the customer-facing storefront.

The purpose of this project was to understand how the different parts of a real e-commerce system work together — from database design and REST APIs to frontend state management, security, order processing and deployment.

---

# ✨ Features

## 🛍️ Customer Storefront

- Modern responsive homepage
- Product catalogue
- Product search and filtering
- Product sorting
- Category-based browsing
- Product detail pages
- Multiple product images
- Product options and variants
- Variant-based pricing
- Stock management
- Shopping cart
- Wishlist
- Cart checkout
- Product-specific delivery charges
- Province / region-based delivery support
- Coupon support
- Order placement
- Order tracking
- Product reviews
- Contact page
- Store information pages
- Responsive mobile, tablet and desktop design

---

## 📦 Product & Variant System

ShopEase supports more than simple products.

Products can contain:

- Multiple images
- Categories
- Brands
- Product options
- Color / size / other option values
- Multiple variants
- Individual variant SKUs
- Variant-level pricing
- Compare-at pricing
- Variant inventory
- Default variants
- Active / inactive variants
- Draft, active and archived product states

This allows products such as headphones or smart watches to have independent variants for different colors or configurations.

---

## 🚚 Delivery System

Delivery charges can be configured individually for supported Pakistani regions:

- Punjab
- Sindh
- Khyber Pakhtunkhwa
- Balochistan
- Gilgit-Baltistan
- Islamabad Capital Territory
- Azad Jammu & Kashmir

Each product can have its own delivery availability and delivery charge.

---

## 💳 Checkout & Orders

The application includes:

- Customer shipping information
- Cart-based checkout
- Product variant validation
- Delivery charge calculation
- Coupon calculations
- Order totals
- Order creation
- Order status management
- Public order tracking
- Payment result handling
- JazzCash payment return workflow
- Order fulfillment tracking

---

# 👨‍💼 Admin Dashboard

ShopEase includes a dedicated administration system.

### Admin capabilities include:

- Secure admin authentication
- Dashboard overview
- Create products
- Edit products
- Archive products
- Upload multiple product images
- Manage categories
- Manage product options
- Manage product variants
- Manage prices and stock
- Configure regional delivery charges
- Manage customer orders
- Manage reviews
- Create and manage coupons
- View analytics
- Monitor sales-related data
- Manage supplier products
- Track supplier fulfillment

---

# 📊 Analytics

The admin analytics workspace provides a dedicated area for monitoring store performance and operational data.

The dashboard architecture separates:

- Catalogue management
- Analytics
- Supplier / fulfillment operations

This keeps administrative workflows organized as the application grows.

---

# 📦 Supplier / Dropshipping Workflow

ShopEase contains a dedicated supplier workspace designed for products fulfilled by an external supplier.

It supports:

- Selecting internal or supplier fulfillment
- Private supplier product codes
- Private supplier SKUs
- Supplier cost tracking
- Expected profit tracking
- External fulfillment status
- Supplier order references
- Tracking references
- Fulfillment status synchronization

Supplier information such as supplier cost and internal identifiers is kept separate from normal customer-facing storefront information.

The current workflow is intentionally designed around **manual supplier fulfillment rather than scraping or undocumented supplier automation**.

---

# 🔐 Security

The backend includes several security measures:

- JWT authentication
- Password hashing with bcrypt
- Helmet security headers
- CORS configuration
- API rate limiting
- Login-specific rate limiting
- Order-creation rate limiting
- Email rate limiting
- Protected admin routes
- Role-based admin authorization
- Request body size limits
- Private supplier fields
- Production-safe server error responses

---

# 🛠️ Tech Stack

## Frontend

| Technology | Purpose |
|---|---|
| **React 19** | User interface |
| **Redux Toolkit** | Global state management |
| **React Redux** | React / Redux integration |
| **React Router** | Client-side routing |
| **Tailwind CSS 4** | Styling and responsive UI |
| **Framer Motion** | UI animations |
| **Axios** | API communication |
| **React Icons** | Interface icons |
| **Vite** | Development and production builds |

## Backend

| Technology | Purpose |
|---|---|
| **Node.js** | JavaScript runtime |
| **Express.js 5** | REST API server |
| **MongoDB** | Database |
| **Mongoose** | MongoDB object modelling |
| **JWT** | Authentication |
| **bcryptjs** | Password hashing |
| **Multer** | File uploads |
| **Nodemailer** | Transactional email |
| **Helmet** | HTTP security headers |
| **express-rate-limit** | API abuse protection |
| **CORS** | Cross-origin access control |

## Development & Deployment

- Git
- GitHub
- Postman
- Vite
- Vercel
- MongoDB

---

# 🏗️ Project Architecture

```text
ShopEase-Ecommerce/
│
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── store/
│   │   └── App.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── scripts/
├── README.md
└── .gitignore
```

---

# 🔌 REST API Architecture

The backend is organized around RESTful API routes for:

```text
/api/users
/api/products
/api/categories
/api/orders
/api/reviews
/api/coupons
/api/payments
/api/email
/api/admin/analytics
/api/admin/markaz
```

Product options, product variants and delivery rates are also managed through product-related API endpoints.

---

# ⚙️ Running ShopEase Locally

## 1. Clone the repository

```bash
git clone https://github.com/syedmuharramali/ShopEase-Ecommerce.git
```

```bash
cd ShopEase-Ecommerce
```

---

## 2. Install backend dependencies

```bash
cd backend
npm install
```

Create:

```text
backend/.env
```

At minimum configure:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
FRONTEND_URL=http://localhost:5173
PORT=5000
```

Additional environment variables may be required for email, payment and other optional integrations.

Start the backend:

```bash
node server.js
```

The API will run on:

```text
http://localhost:5000
```

---

## 3. Install frontend dependencies

Open another terminal:

```bash
cd frontend
npm install
```

Create:

```text
frontend/.env
```

Add:

```env
VITE_BASE_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

The application will normally run on:

```text
http://localhost:5173
```

---

# 🧪 Production Build

To create a frontend production build:

```bash
cd frontend
npm run build
```

---

# 📚 What I Learned

Building ShopEase helped me move beyond isolated mini-projects and work with a larger full-stack application.

Some of the main areas I worked with include:

- Designing MongoDB schemas
- Building REST APIs
- Authentication and authorization
- React component architecture
- Redux Toolkit state management
- Product / variant data modelling
- Shopping-cart logic
- Checkout calculations
- Inventory handling
- Delivery-pricing logic
- Order lifecycle management
- Admin dashboard development
- API security
- Responsive UI development
- Debugging frontend/backend integrations
- Git and GitHub workflows
- Deployment
- Building features around real business requirements

---

# 🚀 Future Improvements

ShopEase will continue to evolve.

Potential improvements include:

- Automated testing
- Expanded payment integrations
- Advanced inventory monitoring
- Improved search
- Product recommendations
- More detailed analytics
- Customer accounts
- Order-history dashboard
- Performance optimization
- SEO improvements
- Expanded supplier integrations

---

# 👨‍💻 Developer

## Syed Muharram Ali

**MERN Stack Developer**

I build responsive, full-stack web applications using JavaScript and the MERN ecosystem.

### Connect with me

- **GitHub:** [github.com/syedmuharramali](https://github.com/syedmuharramali)
- **LinkedIn:** [Syed Muharram Ali](https://www.linkedin.com/in/syedmuharramali/)
- **Live Project:** [ShopEase](https://shopease-sage.vercel.app/)

---

<p align="center">
  Built with ❤️ using the MERN Stack
</p>

<p align="center">
  ⭐ If you found this project useful or interesting, consider giving the repository a star.
</p>
