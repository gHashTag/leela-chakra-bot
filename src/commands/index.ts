import { Composer } from "grammy";

import start from "./start";
import step from "./step";
import buy from "./buy";

const composer = new Composer();

composer.command("start", start);

composer.command("step", step);

composer.command("buy", buy);

export default composer;
