const express = require('express');
const fs = require('fs');
const path = require('path');

const loadRoutes = (app) => {
    // Remove existing routes
    app._router.stack = app._router.stack.filter(layer => {
        return !(layer.route && layer.route.path.startsWith('/api/'));
    });

    const routesConfigPath = path.join(__dirname, 'workspace/routesConfig.json');
    if (fs.existsSync(routesConfigPath)) {
        const routesConfig = JSON.parse(fs.readFileSync(routesConfigPath, 'utf8'));

        routesConfig.forEach(route => {
            const routePath = path.join(__dirname, route.filePath);
            if (fs.existsSync(routePath)) {
                const routeModule = require(routePath);
                app.use(route.endpoint, routeModule);
            } else {
                console.warn(`Route file not found: ${routePath}`);
            }
        });
    } else {
        console.warn('No routes configuration found.');
    }
};

module.exports = loadRoutes;
