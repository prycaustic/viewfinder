import * as db from '$lib/server/mariadb';

/** @type {import('./$types').PageServerLoad} */
export async function load({ url }) {
    const page = url.searchParams.get('page');

    return {
        page: Number(page),
        photos: await db.getSuggestedPhotos(page),
    };
};
