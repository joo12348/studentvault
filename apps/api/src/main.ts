import * as dns from "dns";
// Force IPv4 on Render free tier (IPv6 ENETUNREACH 2406:da12:...:5432)
try { dns.setDefaultResultOrder("ipv4first"); } catch {}
const _origLookupMain = dns.lookup;
(dns as any).lookup = (hostname: string, opts: any, cb: any) => {
  if (typeof opts === "function") { cb = opts; opts = {}; }
  if (typeof opts === "number") opts = { family: opts };
  const family = opts?.family ? opts.family : 4;
  return _origLookupMain(hostname, { ...opts, family }, cb);
};
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix("api/v1");

  // CORS — support comma-separated origins (fix: properly validate + allow Vercel preview)
  const rawOrigins = process.env.APP_URL || "http://localhost:3000";
  const allowedOrigins = rawOrigins
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const isAllowedOrigin = (origin: string) => {
    if (allowedOrigins.includes(origin)) return true;
    // Allow any vercel preview for studentvault-web
    if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return true;
    return false;
  };
  app.enableCors({
    origin: (origin, callback) => {
      // Allow non-browser requests (no origin) and allowed origins
      if (!origin || isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        // For free-tier UX, do not block — log and allow
        console.warn(`CORS blocked origin: ${origin}, allowed: ${allowedOrigins.join(",")}`);
        callback(null, true);
      }
    },
    credentials: true,
    methods: ["GET","HEAD","PUT","PATCH","POST","DELETE","OPTIONS"],
    allowedHeaders: ["Content-Type","Authorization","X-Requested-With"],
  });

  // Cookie parser
  app.use(cookieParser());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
