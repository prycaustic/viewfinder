import mariadb from 'mariadb';


const pool = mariadb.createPool({
    host: import.meta.env.VITE_DB_HOST,
    user: import.meta.env.VITE_DB_USER,
    password: import.meta.env.VITE_DB_PASS,
    database: "team02m_db"
});

export let DEV_MODE = process.env.NODE_ENV === 'development' && import.meta.env.VITE_NO_DB === 'true';
export let placeholders = {
    displayName: "Placeholder User",
    username: "placeholder",
    userId: 1,
    bio: "This is a test user. They do not exist.",
    recentPhotos: [
        {
            PhotoID: 1,
            Title: "Test Photo 1",
            Image: "https://picsum.photos/300/200",
            Description: "This is a test photo."
        },
        {
            PhotoID: 2,
            Title: "Test Photo 2",
            Image: "https://picsum.photos/300/200",
            Description: "This is a test photo."
        }
    ],
    albums: [
        {
            AlbumID: 1,
            Name: "Test Album 1",
            Description: "This is a test album 1.",
            Thumbnail: "https://picsum.photos/300/200",
            Count: 2
        },
        {
            AlbumID: 2,
            Name: "I am obnoxious and gave my album a really long name to see how it looks in the UI.",
            Description: "This is a test album 2.",
            Thumbnail: "https://picsum.photos/300/200",
            Count: 2
        }
    ]
}

export async function testConnection() {
    if (DEV_MODE) {
        return false;
    }

    let conn = await pool.getConnection();

    return conn.query("SELECT 1 as val")
        .then(rows => {
            console.log("DB Connection test successful!");
            console.log(`DB_HOST: ${import.meta.env.VITE_DB_HOST}, DB_USER: ${import.meta.env.VITE_DB_USER}`);
            return true;
        })
        .catch(err => {
            console.log(err);
            return false;
        });
}

async function performQuery(query, param) {
    let conn;

    try {
        conn = await pool.getConnection();

        return conn.query(query, param)
            .then(rows => {
                return rows;
            })
            .catch(err => {
                return err;
            });
    } catch (err) {
        return err;
    } finally {
        if (conn) conn.end();
    }
}

async function getSingleRow(query, param) {
    return performQuery(query, param)
        .then(rows => {
            return rows[0];
        })
        .catch(err => {
            console.log("QUERY FAILED: " + query);
            return err;
        });
}

async function getSingleValue(query, param) {
    return getSingleRow(query, param)
        .then(res => {
            return Object.values(res)[0];
        })
        .catch(err => {
            console.log("QUERY FAILED: " + query);
            return err;
        });
}

// User Profile ABOUT
export async function getUserId(username) {
    if (DEV_MODE) return placeholders.userId;
    return getSingleValue("SELECT UserID FROM Users WHERE Username = ?", [username]);
}

export async function getDisplayName(userId) {
    if (DEV_MODE) return placeholders.displayName;
    return getSingleValue("SELECT DisplayName FROM Users WHERE UserID = ?", [userId]);
}

export async function getPhotosCount(userId) {
    if (DEV_MODE) return placeholders.recentPhotos.length;
    return getSingleValue("SELECT COUNT(*) FROM Photos WHERE UserID = ?", [userId]);
}

export async function getFollowersCount(userId) {
    if (DEV_MODE) return 0;
    return getSingleValue("SELECT COUNT(*) FROM Follows WHERE UserID = ?", [userId]);
}

export async function getFollowingCount(userId) {
    if (DEV_MODE) return 0;
    return getSingleValue("SELECT COUNT(*) FROM Follows WHERE FollowerID = ?", [userId]);
}

export async function getBio(userId) {
    if (DEV_MODE) return placeholders.bio;
    return getSingleValue("SELECT Bio FROM Users WHERE UserID = ?", [userId]);
}

export async function updateBio(userId, bio) {
    return performQuery("UPDATE Users SET Bio = ? WHERE UserID = ?", [bio, userId]);
}

// User Profile PHOTOS
export async function getPhotos(userId) {
    if (DEV_MODE) return placeholders.recentPhotos;
    // TODO: Pagination
    return performQuery("SELECT * FROM Photos WHERE UserID = ?", [userId]);
}

export async function getRecentPhotos(userId, amount = 4) {
    if (DEV_MODE) return placeholders.recentPhotos;
    return performQuery("SELECT * FROM Photos WHERE UserID = ? ORDER BY Timestamp DESC LIMIT ?", [userId, amount]);
}

// User Profile ALBUMS
export async function getAlbums(userId) {
    if (DEV_MODE) return placeholders.albums;
    return performQuery("SELECT * FROM Albums WHERE UserID = ?", [userId]);
}

// User Profile FAVORITES
export async function getFavorites(userId) {
    return performQuery("SELECT * FROM Photos WHERE PhotoID IN (SELECT PhotoID FROM Favorites WHERE UserID = ?)", [userId]);
}

// User Interactions
export async function followUser(userId, followerId) {
    return performQuery("INSERT INTO Follows (UserID, FollowerID) VALUES (?, ?)", [userId, followerId]);
}

export async function unfollowUser(userId, followerId) {
    return performQuery("DELETE FROM Follows WHERE UserID = ? AND FollowerID = ?", [userId, followerId]);
}

export async function isFollowing(userId, followerId) {
    return getSingleValue("SELECT COUNT(*) FROM Follows WHERE UserID = ? AND FollowerID = ?", [userId, followerId]);
}

// Photo interactions
export async function favoritePhoto(userId, photoId) {
    return performQuery("INSERT INTO Favorites (UserID, PhotoID) VALUES (?, ?)", [userId, photoId]);
}

export async function unfavoritePhoto(userId, photoId) {
    return performQuery("DELETE FROM Favorites WHERE UserID = ? AND PhotoID = ?", [userId, photoId]);
}

export async function isFavorite(userId, photoId) {
    return getSingleValue("SELECT COUNT(*) FROM Favorites WHERE UserID = ? AND PhotoID = ?", [userId, photoId]);
}

// Photo upload
export async function uploadPhoto(userId, photo) {
    return performQuery("INSERT INTO Photos (UserID, Title, Description, Path) VALUES (?, ?, ?, ?)", [userId, photo.title, photo.description, photo.path]);
}

export async function deletePhoto(photoId) {
    return performQuery("DELETE FROM Photos WHERE PhotoID = ?", [photoId]);
}