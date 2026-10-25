// Single source for business facts. Written into index.html at build time
// ({{key}} tokens, see vite.config.js) and read by the enquiry form.
// Sources: kit docs/conteudo-en-AU.md + references/informacoes-* (Facebook / Localsearch).
export const site = {
  name: 'Townsville Brake & Wheel Alignment Centre',
  phone: '(07) 4775 6161',
  phoneHref: 'tel:+61747756161',
  email: 'bjefferies80@outlook.com',
  street: 'Unit 2, 34 Pilkington Street',
  streetShort: '2/34 Pilkington Street, Garbutt',
  locality: 'Garbutt QLD 4814',
  facebook: 'https://www.facebook.com/TsvBrakeandWheelAlignment/',
  // TODO(tbwac): swap for the business's own Google place link (cid) once found
  maps: 'https://www.google.com/maps/search/?api=1&query=Townsville+Brake+and+Wheel+Alignment+Centre%2C+2%2F34+Pilkington+Street%2C+Garbutt+QLD+4814',
  year: '2026',
}

export const services = {
  alignment: {
    title: 'Wheel alignment',
    text: 'If your car is pulling to one side or your tyres are wearing unevenly, talk to us about an alignment check. Tell us about your vehicle and what you have noticed.',
  },
  brakes: {
    title: 'Brake repairs',
    text: 'Concerned about noise, vibration or the way your brakes feel? Contact the workshop to discuss an inspection and the work your vehicle needs.',
  },
  tyres: {
    title: 'Tyres & balancing',
    text: 'We supply and fit tyres, and provide rotation and balancing. Tell us your vehicle and tyre requirements so we can discuss the options.',
  },
  suspension: {
    title: 'Steering & suspension',
    text: 'Talk to us about steering, suspension and bearing work. Share your vehicle details and the symptoms you have noticed when you enquire.',
  },
}
