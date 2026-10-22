import { Router } from "express";
import { TwoFactorCont } from "./two_factor.controller";
import { protect } from "@utils/middleware/protect";

export const twofactorrouter = Router();
const twofactorcont = new TwoFactorCont();


twofactorrouter.use(protect);


twofactorrouter.post('/initiate',twofactorcont.initiate);
twofactorrouter.post('/verify',twofactorcont.verify);
