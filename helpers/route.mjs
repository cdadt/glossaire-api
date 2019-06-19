import fs from 'fs';
import path from 'path';

export const importRoutes = (koaRouter, pathRootFolderRoutes, ignored) => {
  const folder = [];
  let koaRouterReturn = koaRouter;

  fs.readdirSync(pathRootFolderRoutes)
    .filter(content => !ignored.includes(content))
    .map(async (content) => {
      if (!fs.lstatSync(`${pathRootFolderRoutes}/${content}`).isDirectory()) {
        const fileNameWithoutExt = content.replace(/\.mjs|.js/, '');
        let pathFileRoutes = path.relative('./helpers', pathRootFolderRoutes);
        pathFileRoutes = path
          .join(pathFileRoutes, fileNameWithoutExt)
          .replace(/\\/g, '/');
        const { default: Route } = await import(pathFileRoutes);
        const pathRootRoute = pathFileRoutes.replace(/\.+\/(\w+)\//, '');
        koaRouterReturn.use(`/${pathRootRoute}`, Route);
      } else {
        folder.push(`${pathRootFolderRoutes}/${content}`);
      }
    });

  folder.forEach((f) => {
    koaRouterReturn = importRoutes(koaRouterReturn, f, ignored);
  });

  return koaRouterReturn;
};

export default importRoutes;
