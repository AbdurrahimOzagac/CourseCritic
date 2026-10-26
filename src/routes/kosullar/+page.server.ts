import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => ({ contact: locals.env.CONTACT_EMAIL });
