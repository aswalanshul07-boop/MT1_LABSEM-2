import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;
const REQUIRED_FIELDS = ['id', 'vehicleName', 'vehicleNumber', 'type', 'price'];

const vehicles = [
  { id: 1, vehicleName: 'Hyundai Creta', vehicleNumber: 'HR26AB1234', type: 'SUV', price: 1500000 },
  { id: 2, vehicleName: 'Honda City', vehicleNumber: 'DL3CAB5678', type: 'Sedan', price: 1200000 },
  { id: 3, vehicleName: 'Tata Nexon', vehicleNumber: 'UP14CD9012', type: 'SUV', price: 1100000 }
];

const sendJson = (res, statusCode, data) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data, null, 2));
};

const sendHtml = (res, statusCode, html) => {
  res.writeHead(statusCode, { 'Content-Type': 'text/html' });
  res.end(html);
};

const handleAddVehicle = (req, res) => {
  let body = '';

  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', () => {
    let vehicle;

    try {
      vehicle = JSON.parse(body);
    } catch (error) {
      return sendJson(res, 400, { error: 'Invalid JSON' });
    }

    if (vehicle === null || typeof vehicle !== 'object' || Array.isArray(vehicle)) {
      return sendJson(res, 400, { error: 'Request body must be a JSON object' });
    }

    const missingFields = REQUIRED_FIELDS.filter(
      (field) => vehicle[field] === undefined || vehicle[field] === null || vehicle[field] === ''
    );

    if (missingFields.length > 0) {
      return sendJson(res, 400, {
        error: 'Missing required fields',
        missingFields
      });
    }

    if (typeof vehicle.price !== 'number' || vehicle.price <= 0) {
      return sendJson(res, 400, { error: 'Price must be a positive number' });
    }

    if (vehicles.some((existing) => existing.id === vehicle.id)) {
      return sendJson(res, 400, { error: `Vehicle with id ${vehicle.id} already exists` });
    }

    const newVehicle = {
      id: vehicle.id,
      vehicleName: vehicle.vehicleName,
      vehicleNumber: vehicle.vehicleNumber,
      type: vehicle.type,
      price: vehicle.price
    };

    vehicles.push(newVehicle);
    sendJson(res, 201, { message: 'Vehicle added successfully', vehicle: newVehicle });
  });

  req.on('error', () => {
    sendJson(res, 400, { error: 'Error reading request body' });
  });
};

const server = http.createServer((req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  const method = req.method;

  if (method === 'GET' && pathname === '/') {
    return sendHtml(
      res,
      200,
      `<!DOCTYPE html>
<html>
<head><title>Vehicle Management</title></head>
<body>
  <h1>Welcome to the Vehicle Management Application</h1>
  <ul>
    <li><a href="/vehicles">Vehicles (JSON)</a></li>
    <li><a href="/about">About</a></li>
    <li><a href="/info">Info</a></li>
  </ul>
</body>
</html>`
    );
  }

  if (method === 'GET' && pathname === '/vehicles') {
    return sendJson(res, 200, vehicles);
  }

  if (method === 'GET' && pathname === '/about') {
    return sendHtml(
      res,
      200,
      `<!DOCTYPE html>
<html>
<head><title>About</title></head>
<body>
  <h1>About</h1>
  <p>Vehicle Management Web Application built with the Node.js HTTP module.</p>
  <p>Version 1.0.0 | Data is stored in a JavaScript array (no database).</p>
</body>
</html>`
    );
  }

  if (method === 'GET' && pathname === '/info') {
    const filePath = path.join(__dirname, 'public', 'info.html');
    return fs.readFile(filePath, (err, data) => {
      if (err) {
        return sendJson(res, 500, { error: 'Unable to read info.html' });
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  }

  if (method === 'POST' && pathname === '/add-vehicle') {
    return handleAddVehicle(req, res);
  }

  sendJson(res, 404, { error: 'Route not found' });
});

server.listen(PORT, () => {
  console.log(`HTTP Server running at http://localhost:${PORT}`);
});