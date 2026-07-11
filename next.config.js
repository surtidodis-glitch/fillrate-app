/** @type {import('next').NextConfig} */

// Si vas a desplegar en GitHub Pages bajo https://usuario.github.io/nombre-repo/,
// descomenta basePath/assetPrefix y pon el nombre real de tu repositorio.
// En Vercel no necesitas tocar nada de esto.
const REPO_NAME = "fillrate-app";
const isGithubPages = process.env.DEPLOY_TARGET === "github-pages";

const nextConfig = {
  output: "export", // genera HTML/JS estático en /out, sin servidor Node
  images: { unoptimized: true }, // next/image no puede optimizar sin servidor
  basePath: isGithubPages ? `/${REPO_NAME}` : "",
  assetPrefix: isGithubPages ? `/${REPO_NAME}/` : "",
};

module.exports = nextConfig;
