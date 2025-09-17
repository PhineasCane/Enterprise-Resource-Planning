require("dotenv").config();

// module.exports = {
//   PORT: process.env.PORT || 5000,
//   DATABASE_URL: process.env.DATABASE_URL,
//   JWT_SECRET: process.env.JWT_SECRET,
//   JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "100000d",
// };

module.exports = {
  PORT: 5000,
  DATABASE_URL: "postgres://avnadmin:AVNS_QO90_W2k_RE-Ig37l7J@garden-phineasnjoroge11-83a7.d.aivencloud.com:14355/defaultdb?sslmode=no-verify",
  JWT_SECRET: "f7709dcb7852d37c2cbefcee85615ea320da532e8a0b7de8ef9fdd7ae16ca49dfdabf978b3eb1973eea8b559949d8ae528f7d74dcec356e3fd1235e1acf47cdc",
  JWT_EXPIRES_IN: "100000d",
};
