import mongoose from 'mongoose';
export const CATEGORIES = ['Roads and potholes','Garbage and sanitation','Streetlights and electricity','Water leakage','Drainage and flooding','Public property damage','Footpaths and accessibility','Other'];
export const STATUSES = ['Reported','Under Review','In Progress','Resolved','Rejected'];
const historySchema = new mongoose.Schema({
  previousStatus: String, newStatus: String, note: { type: String, maxlength: 500, default: '' },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, changedAt: { type: Date, default: Date.now }
}, { _id: false });
const reportSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, minlength: 5, maxlength: 120 },
  description: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
  category: { type: String, required: true, enum: CATEGORIES },
  status: { type: String, enum: STATUSES, default: 'Reported' },
  locationName: { type: String, required: true, trim: true, maxlength: 200 },
  // GeoJSON [longitude, latitude]; the whole field is omitted when no coordinates were supplied.
  location: { type: { type: String, enum: ['Point'] }, coordinates: { type: [Number] } },
  imageUrl: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  statusHistory: [historySchema]
}, { timestamps: true });
reportSchema.index({ location: '2dsphere' });
reportSchema.index({ category: 1, status: 1, createdAt: -1 });
reportSchema.index({ title: 'text', description: 'text', locationName: 'text' });
export default mongoose.model('Report', reportSchema);
