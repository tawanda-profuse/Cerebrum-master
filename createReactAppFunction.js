require('dotenv').config();
const OpenAI = require('openai');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
const fsPromises = require('fs').promises;
const path = require('path');
const executeCommand = require('./executeCommand');
const ProjectCoordinator = require('./projectCoordinator');

async function createReactApp(
    projectName,
    projectId,
    selectedProject,
    User,
    userId
) {
    selectedProject.stage = 0.5;
    User.addProject(userId, selectedProject);
    const projectCoordinator = new ProjectCoordinator(openai, projectId);
    try {
        const workspaceDir = path.join(__dirname, 'workspace');
        // Check if the workspace directory exists, if not, create it
        await fsPromises.mkdir(workspaceDir, { recursive: true });
        // Create a directory for the project using projectId
        const projectDir = path.join(workspaceDir, projectId);
        // Check if the project directory exists, if not, create it
        await fsPromises.mkdir(projectDir, { recursive: true });

        // Create the HTML project structure
        await projectCoordinator.logStep(
          `I am now creating your HTML project named ${projectName}...`
      );

      // Create script.js
      const scriptJsContent = ``; // Empty script.js file
      await fsPromises.writeFile(path.join(projectDir, 'script.js'), scriptJsContent);
      await projectCoordinator.logStep('script.js created.');

      // Create index.html
      const indexHtmlContent = `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${projectName}</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-100 text-gray-800">
        <div class="container mx-auto p-4">
            <h1 class="text-4xl font-bold text-center">${projectName}</h1>
        </div>
        <script src="./script.js"></script>
      </body>
      </html>`;

      await fsPromises.writeFile(path.join(projectDir, 'index.html'), indexHtmlContent);
      await projectCoordinator.logStep('index.html created.');

      // Create styles.css
      const stylesCssContent = `@tailwind base;\n@tailwind components;\n@tailwind utilities;`;
      await fsPromises.writeFile(path.join(projectDir, 'styles.css'), stylesCssContent);
      await projectCoordinator.logStep('styles.css created.');

        // Initialize npm and install Tailwind CSS
        await projectCoordinator.logStep('Initializing npm and installing Tailwind CSS...');
        await executeCommand(`npm init -y`, projectDir);
        await executeCommand(`npm install tailwindcss postcss autoprefixer`, projectDir);
        await executeCommand(`npx tailwindcss init -p`, projectDir);

        // Configure Tailwind CSS
        const tailwindConfigPath = path.join(projectDir, 'tailwind.config.js');
        const tailwindConfigContent = `module.exports = {
            content: ['./*.html'],
            theme: {
                extend: {
                    colors: {
                        brown:{
                          DEFAULT: '#A85563',
                          50: '#FBE9E7',
                          100: '#F1D3CE',
                          200: '#E5B8B2',
                          300: '#D39E99',
                          400: '#C1807E',
                          500: '#A85563',
                          600: '#93303F',
                          700: '#7E2A37',
                          800: '#69232F',
                          900: '#521D27',
                        },
                        gray: {
                          DEFAULT: '#6B7280',
                          50: '#F9FAFB',
                           100: '#F3F4F6',
                           200: '#E5E7EB',
                           300: '#D1D5DB',
                           400: '#9CA3AF',
                           500: '#6B7280',
                           600: '#4B5563',
                           700: '#374151',
                           800: '#1F2937',
                           900: '#111827',
                         },
                        red: {
                          DEFAULT: '#EF4444',
                          50: '#FEF2F2',
                          100: '#FEE2E2',
                          200: '#FECACA',
                          300: '#FCA5A5',
                          400: '#F87171',
                          500: '#EF4444',
                          600: '#DC2626',
                          700: '#B91C1C',
                          800: '#991B1B',
                          900: '#7F1D1D',
                        },
                        emerald: {
                          DEFAULT: '#10B981',
                          50: '#ECFDF5',
                          100: '#D1FAE5',
                          200: '#A7F3D0',
                          300: '#6EE7B7',
                          400: '#34D399',
                          500: '#10B981',
                          600: '#059669',
                          700: '#047857',
                          800: '#065F46',
                          900: '#064E3B',
                        },
                        blue: {
                          DEFAULT: '#3B82F6',
                          50: '#EFF6FF',
                          100: '#DBEAFE',
                          200: '#BFDBFE',
                          300: '#93C5FD',
                          400: '#60A5FA',
                          500: '#3B82F6',
                          600: '#2563EB',
                          700: '#1D4ED8',
                          800: '#1E40AF',
                          900: '#1E3A8A',
                        },
                        amber: {
                          DEFAULT: '#F59E0B',
                          50: '#FFFBEB',
                          100: '#FEF3C7',
                          200: '#FDE68A',
                          300: '#FCD34D',
                          400: '#FBBF24',
                          500: '#F59E0B',
                          600: '#D97706',
                          700: '#B45309',
                          800: '#92400E',
                          900: '#78350F',
                        },
                        yellow: {
                          DEFAULT: '#FBBF24',
                          50: '#FEFCE8',
                          100: '#FEF9C3',
                          200: '#FEF08A',
                          300: '#FDE047',
                          400: '#FACC15',
                          500: '#EAB308',
                          600: '#CA8A04',
                          700: '#A16207',
                          800: '#854D0E',
                          900: '#713F12',
                        },
                        orange: {
                          DEFAULT: '#F97316',
                          50: '#FFFBEB',
                          100: '#FEF3C7',
                          200: '#FDE68A',
                          300: '#FCD34D',
                          400: '#FBBF24',
                          500: '#F59E0B',
                          600: '#D97706',
                          700: '#B45309',
                          800: '#92400E',
                          900: '#78350F',
                        },
                        pink: {
                          DEFAULT: '#EC4899',
                          50: '#FDF2F8',
                          100: '#FCE7F3',
                          200: '#FBCFE8',
                          300: '#F9A8D4',
                          400: '#F472B6',
                          500: '#EC4899',
                          600: '#DB2777',
                          700: '#BE185D',
                          800: '#9D174D',
                          900: '#831843',
                        },
                        violet: {
                          DEFAULT: '#7C3AED',
                          50: '#F5F3FF',
                          100: '#EDE9FE',
                          200: '#DDD6FE',
                          300: '#C4B5FD',
                          400: '#A78BFA',
                          500: '#8B5CF6',
                          600: '#7C3AED',
                          700: '#6D28D9',
                          800: '#5B21B6',
                          900: '#4C1D95',
                        },
                        lime: {
                          DEFAULT: '#84CC16', 
                          50: '#F7FEE7',
                          100: '#ECFCCB',
                          200: '#D9F99D',
                          300: '#BEF264',
                          400: '#A3E635',
                          500: '#84CC16',
                          600: '#65A30D',
                          700: '#4D7C0F',
                          800: '#3F6212',
                          900: '#365314',
                        },
                        teal: {
                          DEFAULT: '#14B8A6',
                          50: '#F0FDFA',
                          100: '#CCFBF1',
                          200: '#99F6E4',
                          300: '#5EEAD4',
                          400: '#2DD4BF',
                          500: '#14B8A6',
                          600: '#0D9488',
                          700: '#0F766E',
                          800: '#115E59',
                          900: '#134E4A',
                        },
                        purple:{
                          DEFAULT: '#8B5CF6',
                          50: '#F5F3FF',
                          100: '#EDE9FE',
                          200: '#DDD6FE',
                          300: '#C4B5FD',
                          400: '#A78BFA',
                          500: '#8B5CF6',
                          600: '#7C3AED',
                          700: '#6D28D9',
                          800: '#5B21B6',
                          900: '#4C1D95',
                        },
                        indigo: {
                          DEFAULT: '#6366F1',
                          50: '#EEF2FF',
                          100: '#E0E7FF',
                          200: '#C7D2FE',
                          300: '#A5B4FC',
                          400: '#818CF8',
                          500: '#6366F1',
                          600: '#4F46E5',
                          700: '#4338CA',
                          800: '#3730A3',
                          900: '#312E81',
                        },
                        silver: {
                          DEFAULT: '#D1D5DB',
                          50: '#FAFAFA',
                          100: '#F5F5F5',
                          200: '#EEEEEE',
                          300: '#E0E0E0',
                          400: '#BDBDBD',
                          500: '#9E9E9E',
                          600: '#757575',
                          700: '#616161',
                          800: '#424242',
                          900: '#212121',
                        },
                        green: {
                          DEFAULT: '#10B981',
                          50: '#F0FFF4',
                          100: '#C6F6D5',
                          200: '#9AE6B4',
                          300: '#68D391',
                          400: '#48BB78',
                          500: '#38A169',
                          600: '#2F855A',
                          700: '#276749',
                          800: '#22543D',
                          900: '#1C4532',
                        },
                        rose:{
                          DEFAULT: '#F43F5E',
                          50: '#FFF1F2',
                          100: '#FFE4E6',
                          200: '#FECDD3',
                          300: '#FDA4AF',
                          400: '#FB7185',
                          500: '#F43F5E',
                          600: '#E11D48',
                          700: '#BE123C',
                          800: '#9F1239',
                          900: '#881337',
                        },
                        slate:{
                          DEFAULT: '#374151',
                          50: '#F4F5F7',
                          100: '#E5E7EB',
                          200: '#D2D6DC',
                          300: '#9FA6B2',
                          400: '#6B7280',
                          500: '#4B5563',
                          600: '#374151',
                          700: '#252F3F',
                          800: '#161E2E',
                          900: '#0E1621',
                        },
                        gold: {
                         DEFAULT: '#FBBF24',
                         50: '#FFFBEB',
                          100: '#FEF3C7',
                          200: '#FDE68A',
                          300: '#FCD34D',
                          400: '#FBBF24',
                          500: '#F59E0B',
                          600: '#D97706',
                          700: '#B45309',
                          800: '#92400E',
                          900: '#78350F',
                        }
                      },
                },
            },
            plugins: [],
        };
        `;
        await fsPromises.writeFile(tailwindConfigPath, tailwindConfigContent);
        await projectCoordinator.logStep('Tailwind CSS configured.');

    } catch (error) {
        await projectCoordinator.logStep(`An error occurred: ${error}`);
    }
}

module.exports = createReactApp;
