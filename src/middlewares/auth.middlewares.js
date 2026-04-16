import createError from "http-errors";
import jwt from "jsonwebtoken";
import { findUserById } from "../services/auth.service.js";

async function authCheck(req, res, next) {
  try {
    const authorization = req.headers.authorization;
    if (!authorization) {
      throw createError(401, "Unauthorization");
    }

    console.log(authorization);
    const token = authorization.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    const user = await findUserById(payload.id);
    if (!user) {
      throw createError(401, "Unauthorization");
    }
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
export default authCheck;