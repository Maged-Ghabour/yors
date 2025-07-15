const router = require("express").Router();
const db = require("../core/db.js");
const {
  RequestStatus,
  UserType,
} = require("../prisma/generated/prisma/index.js");

router.route("/").get(async (req, res) => {
  const newRequests = await db.request.count({
    where: {
      schoolId: req.session.user?.id,
      status: RequestStatus.NEW,
    },
  });
  const viewedRequests = await db.request.count({
    where: {
      schoolId: req.session.user?.id,
      status: RequestStatus.VIEWED,
    },
  });
  const acceptedRequests = await db.request.count({
    where: {
      schoolId: req.session.user?.id,
      status: RequestStatus.ACCEPTED,
    },
  });
  const rejectedRequests = await db.request.count({
    where: {
      schoolId: req.session.user?.id,
      status: RequestStatus.REJECTED,
    },
  });
  res.render("school/dashboard", {
    newRequests,
    acceptedRequests,
    rejectedRequests,
    viewedRequests,
  });
});

router.route("/requests").get(async (req, res) => {
  const requestType = req.query.type;
  const requests = (
    await db.request.findMany({
      where: {
        schoolId: req.session.user?.id,
        status: requestType,
      },
      include: {
        school: true,
        student: true,
        parent: true,
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

  res.render("school/requests", { requests, selectedType: requestType });
});

router.route("/search").get(async (req, res) => {
  const parentPhone = req.query.parentPhone;
  if (!parentPhone) {
    res.render("school/search");
    return;
  }

  const parent = (
    await db.user.findMany({
      where: {
        phone: parentPhone,
      },
    })
  )[0];

  if (!parent) {
    res.render("school/search", { requests: [] });
    return;
  }

  const requests = (
    await db.request.findMany({
      where: {
        parentId: parent.id,
        schoolId: req.session.user?.id,
      },
      include: {
        school: true,
        student: true,
        parent: true,
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
  res.render("school/search", { requests });
});

router
  .route("/students")
  .get(async (req, res) => {
    const students = await db.student.findMany({
      where: {
        schoolId: req.session.user?.id,
      },
      include: {
        school: true,
        parent: true,
      },
    });

    res.render("school/students", { students });
  })
  .post(async (req, res) => {
    const { name } = req.body;
    await db.student.create({
      data: {
        name: name,
        schoolId: req.session.user?.id,
      },
    });
    res.redirect("/school/students");
  });

router
  .route("/add-student")
  .get((req, res) => {
    res.render("school/add-student");
  })
  .post(async (req, res) => {
    const {
      studentName,
      studentNationalNumber,
      parentPhone,
      parentNationalNumber,
      parentName,
    } = req.body;

    // check if parent exists
    let parent = await db.user.findFirst({
      where: {
        OR: [{ phone: parentPhone }, { nationalNumber: parentNationalNumber }],
      },
    });
    if (parent == null) {
      // create new parent if not found
      parent = await db.user.create({
        data: {
          name: parentName,
          phone: parentPhone,
          userType: UserType.PARENT,
          nationalNumber: parentNationalNumber,
        },
      });
    }
    // now create new student and attach current schoolId and the parent id
    await db.student.create({
      data: {
        name: studentName,
        nationalNumber: studentNationalNumber,
        schoolId: req.session.user?.id,
        parentId: parent.id,
      },
    });
    res.redirect("/school/students");
  });

module.exports = router;
