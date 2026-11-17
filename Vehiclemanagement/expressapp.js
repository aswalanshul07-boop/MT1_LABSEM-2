import express from 'express';

const app = express();
const PORT = 4000;
const REQUIRED_FIELDS = ['vehicleName', 'vehicleNumber', 'type', 'price'];

app.use(express.json());

let vehicles = [
  { id: 1, vehicleName: 'Hyundai Creta', vehicleNumber: 'HR26AB1234', type: 'SUV', price: 1500000 },
  { id: 2, vehicleName: 'Honda City', vehicleNumber: 'DL3CAB5678', type: 'Sedan', price: 1200000 },
  { id: 3, vehicleName: 'Tata Nexon', vehicleNumber: 'UP14CD9012', type: 'SUV', price: 1100000 }
];

// Returns an error message string, or null if the body is valid.
const validateVehicle = (body, requireId = false) => {
  if (!body || typeof body !== 'object') {
    return 'Request body must be a JSON object';
  }

  const fields = requireId ? ['id', ...REQUIRED_FIELDS] : REQUIRED_FIELDS;
  const missing = fields.filter(
    (field) => body[field] === undefined || body[field] === null || body[field] === ''
  );

  if (missing.length > 0) {
    return `Missing required fields: ${missing.join(', ')}`;
  }

  if (typeof body.price !== 'number' || !Number.isFinite(body.price) || body.price <= 0) {
    return 'Price must be a positive number';
  }

  if (requireId && !Number.isInteger(Number(body.id))) {
    return 'id must be an integer';
  }

  return null;
};

const parseId = (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Invalid vehicle id' });
    return null;
  }
  return id;
};

// GET all vehicles
app.get('/vehicles', (req, res) => {
  res.json(vehicles);
});

// GET vehicle by id
app.get('/vehicles/:id', (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;

  const vehicle = vehicles.find((v) => v.id === id);
  if (!vehicle) {
    return res.status(404).json({ error: `Vehicle with id ${id} not found` });
  }
  res.json(vehicle);
});

// POST add a vehicle
app.post('/vehicles', (req, res) => {
  const error = validateVehicle(req.body, true);
  if (error) {
    return res.status(400).json({ error });
  }

  const id = Number(req.body.id);
  if (vehicles.some((v) => v.id === id)) {
    return res.status(400).json({ error: `Vehicle with id ${id} already exists` });
  }

  const { vehicleName, vehicleNumber, type, price } = req.body;
  const vehicle = { id, vehicleName, vehicleNumber, type, price };
  vehicles.push(vehicle);

  res.status(201).json({ message: 'Vehicle added successfully', vehicle });
});

// PUT update a vehicle
app.put('/vehicles/:id', (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;

  const index = vehicles.findIndex((v) => v.id === id);
  if (index === -1) {
    return res.status(404).json({ error: `Vehicle with id ${id} not found` });
  }

  const error = validateVehicle(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  const { vehicleName, vehicleNumber, type, price } = req.body;
  vehicles[index] = { id, vehicleName, vehicleNumber, type, price };

  res.json({ message: 'Vehicle updated successfully', vehicle: vehicles[index] });
});

// DELETE a vehicle
app.delete('/vehicles/:id', (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;

  const index = vehicles.findIndex((v) => v.id === id);
  if (index === -1) {
    return res.status(404).json({ error: `Vehicle with id ${id} not found` });
  }

  const [deletedVehicle] = vehicles.splice(index, 1);
  res.json({ message: 'Vehicle deleted successfully', vehicle: deletedVehicle });
});

// Unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (malformed JSON, etc.)
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Express Server running at http://localhost:${PORT}`);
});