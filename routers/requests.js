const router = require("express").Router();
const db = require("../core/db.js");
const { onlySchool } = require("../middlewares/school");
const {
  UserType,
  RequestStatus,
} = require("../prisma/generated/prisma/index.js");

router.route("/:id").get(async (req, res) => {
  const request = await db.request.findUnique({
    where: {
      id: parseInt(req.params.id),
    },
    include: {
      school: true,
      student: true,
      parent: true,
    },
  });

  // update request status to viewed
  if (
    request.status === RequestStatus.NEW &&
    req.session.user?.userType === UserType.SCHOOL
  ) {
    await db.request.update({
      where: {
        id: request.id,
      },
      data: {
        status: RequestStatus.VIEWED,
      },
    });
  }

  if (request.acceptedAt) {
    request.acceptedAt = new Date(request.acceptedAt).toLocaleString();
  }

  res.render("request-details", {
    canMakeAction:
      req.session.user?.userType === UserType.SCHOOL &&
      [RequestStatus.NEW, RequestStatus.VIEWED].includes(request.status),
    request: {
      ...request,
      attachments:
        request.attachments.length > 0 ? request.attachments?.split(",") : [],
    },
  });
});

router.route("/:id/accept", onlySchool).post(async (req, res) => {
  // update
  await db.request.update({
    where: {
      id: parseInt(req.params.id),
    },
    data: {
      status: RequestStatus.ACCEPTED,
      acceptedAt: new Date(),
    },
  });

  // redirect to same page
  res.redirect(`/requests/${req.params.id}`);
});

router.route("/:id/reject", onlySchool).post(async (req, res) => {
  // update
  await db.request.update({
    where: {
      id: parseInt(req.params.id),
    },
    data: {
      status: RequestStatus.REJECTED,
      acceptedAt: new Date(),
    },
  });

  // redirect to same page
  res.redirect(`/requests/${req.params.id}`);
});

module.exports = router;
