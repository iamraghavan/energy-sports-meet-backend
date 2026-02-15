const { Octokit } = require('@octokit/rest');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

/**
 * Uploads a file to GitHub repository and returns the CDN URL.
 * @param {Object} file - The file object from multer (buffer, originalname, mimetype)
 * @param {String} folder - The folder path in the repo (e.g., 'payments', 'proofs')
 * @returns {Promise<String>} - The jsDelivr CDN URL
 */
async function uploadToGitHub(file, folder = 'uploads') {
    try {
        const fileExtension = path.extname(file.originalname || file.name);
        const fileName = `${folder}/${uuidv4()}${fileExtension}`;
        const content = file.buffer.toString('base64');

        await octokit.repos.createOrUpdateFileContents({
            owner: process.env.ASSET_GH_OWNER,
            repo: process.env.ASSET_GH_REPO,
            path: fileName,
            message: `Upload ${fileName}`,
            content: content,
            committer: {
                name: 'Sports Event Bot',
                email: 'bot@sportsevent.com'
            },
            author: {
                name: 'Sports Event Bot',
                email: 'bot@sportsevent.com'
            }
        });

        // Construct jsDelivr URL
        const cdnUrl = `https://cdn.jsdelivr.net/gh/${process.env.ASSET_GH_OWNER}/${process.env.ASSET_GH_REPO}@${process.env.ASSET_GH_BRANCH || 'main'}/${fileName}`;
        return cdnUrl;

    } catch (error) {
        console.error('GitHub Upload Error:', error);
        throw new Error('Failed to upload file to storage');
    }
}

module.exports = { uploadToGitHub };
