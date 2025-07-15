const router = require("express").Router();
const db = require("../core/db.js");
const multer = require("multer");
const { UserType } = require("../prisma/generated/prisma");

const upload = multer({ dest: "uploads/" });

router.route("/").get(async (req, res) => {
  const requests = (
    await db.request.findMany({
      where: {
        parentId: req.session.user?.id,
      },
      include: {
        school: true,
        student: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })
  ).map((r) => {
    if (r.acceptedAt) {
      r.acceptedAt = new Date(r.acceptedAt).toLocaleString();
    }
    return r;
  });

  res.render("parent/requests", { requests, user: req.session.user });
});

router
  .route("/create-request")
  .get(async (req, res) => {
    const students = await db.student.findMany({
      where: {
        parentId: req.session.user?.id,
      },
      include: {
        parent: true,
        school: true,
      },
    });
    res.render("parent/create-request", { students, user: req.session.user });
  })
  .post(upload.array("attachments"), async (req, res) => {
    const students = await db.student.findMany({
      where: {
        parentId: req.session.user?.id,
      },
      include: {
        parent: true,
        school: true,
      },
    });
    // getting values from form inputs
    let attachments = req.files?.map((f) => f.path) ?? [];
    attachments = attachments.join(",");
    let { studentId, reason } = req.body;
    studentId = parseInt(req.body.studentId);
    if (!studentId) {
      res.render("parent/create-request", {
        students,
        error: "فشل انشاء طلب الاستئذان",
        user: req.session.user,
      });
      return;
    }
    const student = await db.student.findFirst({
      where: {
        id: studentId,
      },
      include: {
        parent: true,
        school: true,
      },
    });
    // create request
    const newRequest = await db.request.create({
      data: {
        reason,
        attachments,
        parentId: student.parent.id,
        schoolId: student.school.id,
        studentId: student.id,
      },
    });
    if (newRequest != null) {
      res.redirect("/parent");
      return;
    } else {
      res.render("parent/create-request", {
        schools,
        error: "فشل انشاء طلب الاستئذان",
        user: req.session.user,
      });
    }
  });

router.route("/get-students/").get(async (req, res) => {
  const schoolId = parseInt(req.query.schoolId);
  if (!schoolId) return res.json([]);
  const students = await db.student.findMany({
    where: {
      schoolId: schoolId,
    },
  });
  res.json(students);
});

router.route("/profile").get(async (req, res) => {
  const userId = req.session.user?.id;

  if (!userId) {
    return res.redirect("/login");
  }

  const parent = await db.user.findFirst({
    where: {
      id: userId,
      userType: "PARENT",
    },
    include: {
      parentStudents: true,
    },
  });

  if (!parent) {
    return res.status(404).send("ولي الأمر غير موجود");
  }

  res.render("parent/profile", { user: parent });
});

module.exports = router;
