
import type {NextConfig} from 'next';

const IS_GITHUB_PAGES = process.env.GITHUB_PAGES === 'true';

// IMPORTANT: This is set to 'starbux' as per your request for the /starbux subpath.
// If your new repository has a different name, update this value accordingly.
// For example, if your repository URL is https://github.com/your-username/my-cool-app,
// then REPO_NAME should be 'my-cool-app'.
const REPO_NAME = 'starbux';

const nextConfig: NextConfig = {
  output: 'export', // Crucial for static site generation

  // basePath and assetPrefix are necessary if your GitHub Pages site is served from a subdirectory
  // (e.g., https://your-username.github.io/REPO_NAME/).
  // If you are using a custom domain pointed at the root of your GitHub Pages site,
  // you might not need these or can set them to an empty string.
  basePath: IS_GITHUB_PAGES ? `/${REPO_NAME}` : '',
  assetPrefix: IS_GITHUB_PAGES ? `/${REPO_NAME}/` : '',

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // For GitHub Pages, using unoptimized images can simplify deployment
    // as it avoids issues with Next.js's default image optimization loader in a static environment.
    unoptimized: IS_GITHUB_PAGES ? true : false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
