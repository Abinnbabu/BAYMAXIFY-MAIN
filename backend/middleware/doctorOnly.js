module.exports = function doctorOnly(req, res, next) {
  if (req.user?.role !== "doctor") {
    return res.status(403).json({ message: "Doctor access required" });
  }
  next();
};
