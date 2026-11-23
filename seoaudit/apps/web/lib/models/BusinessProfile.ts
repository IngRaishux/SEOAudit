import mongoose from 'mongoose';

// Se asocia a organización + origen y no a un Site: cada crawl crea un Site nuevo
const businessProfileSchema = new mongoose.Schema(
  {
    organizationId: {
      type: String,
      required: true,
    },
    origin: {
      type: String,
      required: true,
    },
    defaultLanguage: {
      type: String,
      required: true,
    },
    languages: {
      type: [String],
      default: [],
    },
    businessKind: {
      type: String,
      enum: ['hotel', 'hotel-chain', 'local-business', 'organization'],
      required: true,
    },
    // La forma de cada entidad la valida lib/geo/profile.ts; aquí se guarda tal cual
    entities: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    // @id que el usuario aceptó reemplazar: { [@id existente]: @id del perfil }
    acceptedIdRewrites: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true, minimize: false }
);

businessProfileSchema.index({ organizationId: 1, origin: 1 }, { unique: true });

export default mongoose.models.BusinessProfile ||
  mongoose.model('BusinessProfile', businessProfileSchema);
