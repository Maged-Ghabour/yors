const router = require("express").Router();
const bcrypt = require("bcrypt");
const db = require("../core/db.js");
const { UserType } = require("../prisma/generated/prisma/wasm.js");
const { sendOtp, verifyOtp } = require("../core/sms.js");
const DB_OTP = process.env.DB_OTP == "true";

// router
//   .route("/signup")
//   .get((req, res) => {
//     res.render("signup-school");
//   })
//   .post(async (req, res) => {
//     const { name, email, phone, password } = req.body;
//     // check if user email exists
//     const foundUser = await db.user.findMany({
//       where: {
//         email: email,
//       },
//     });
//     if (foundUser != null && foundUser.length > 0) {
//       res.render("signup-school", { error: "البريد الالكتروني موجود بالفعل" });
//       return;
//     }
//     // create new school user
//     const user = await db.user.create({
//       data: {
//         name: name,
//         email: email,
//         password: password,
//         userType: UserType.SCHOOL,
//       },
//     });
//     // give session
//     req.session.user = user;
//     req.session.user.access = UserType.SCHOOL;
//     req.session.save();
//     // redirect to otp page
//     res.redirect("/school");
//   });

router
  .route("/login")
  .get((req, res) => {
    const loginType = req.query.loginType;
    if (req.session.user?.access == UserType.PARENT) {
      res.redirect("/parent");
      return;
    }
    if (req.session.user?.access == UserType.SCHOOL) {
      res.redirect("/school");
      return;
    }

    if (loginType == UserType.PARENT) {
      res.render("login-parent");
    } else if (loginType == UserType.SCHOOL) {
      res.render("login-school");
    } else {
      res.render("login");
    }
  })
  .post(async (req, res) => {
    req.session.user = null;
    req.session.save();
    const { loginType, email, password, phone } = req.body;
    const template =
      loginType == UserType.SCHOOL ? "login-school" : "login-parent";
    // check if valid credentials
    let user;
    if (loginType == UserType.SCHOOL) {
      user = await db.user.findFirst({
        where: {
          email: email,
        },
      });
    } else {
      user = await db.user.findFirst({
        where: {
          phone: phone,
        },
      });
    }
    if (user == null) {
      res.render(template, { error: "معلومات الدخول غير صحيحة" });
      return;
    }

    if (loginType == UserType.SCHOOL) {
      // verify password
      const validPassword = await bcrypt.compare(
        password,
        user.password ?? "-"
      );
      if (!validPassword) {
        res.render(template, { error: "كلمة المرور غير صحيحة" });
        return;
      }
    }
    // save user session
    req.session.user = user;
    req.session.save();
    // if user type is parent do:
    if (user.userType == UserType.PARENT) {
      // generate an otp of 6 digits
      const otp = "000000";
      // update user otp
      await db.user.update({
        where: {
          id: user.id,
        },
        data: {
          otp: otp,
        },
      });
      if (!DB_OTP) {
        await sendOtp(user.phone);
      }
      // redirect to otp page
      res.redirect("/auth/otp");
    } else {
      // if user type is school do:
      // redirect to school dashboard
      req.session.user.access = UserType.SCHOOL;
      res.redirect("/school");
    }
  });

router
  .route("/otp")
  .get((req, res) => {
    res.render("otp");
  })
  .post(async (req, res) => {
    const { otp } = req.body;
    if (req.session.user?.id == null) {
      res.render("otp", { error: "يرجى تسجيل الدخول اولا" });
      return;
    }

    // find logged in user
    const user = await db.user.findUnique({
      where: {
        id: req.session.user.id,
      },
    });

    if (DB_OTP) {
      // check if valid otp and session user
      // check if otp is valid
      if (user.otp != otp) {
        res.render("otp", { error: "الرمز غير صحيح" });
        return;
      }
      // update user otp to null
      await db.user.update({
        where: {
          id: user.id,
        },
        data: {
          otp: null,
        },
      });
    } else {
      const verified = await verifyOtp(user.phone, otp);
      if (!verified) {
        res.render("otp", { error: "الرمز غير صحيح" });
        return;
      }
    }

    // give user session access to parent dashboard
    req.session.user.access = UserType.PARENT;
    req.session.save();
    // redirect to user dashboard based on user type
    res.redirect("/parent");
  });

router.route("/logout").get((req, res) => {
  req.session.destroy();
  res.redirect("/auth/login");
});

module.exports = router;
