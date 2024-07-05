const DomainMapping = require('../models/DomainMapping');
const upload = multer({ dest: 'uploads/' });

app.post('/api/domain-mapping', upload.fields([
    { name: 'sslCert', maxCount: 1 },
    { name: 'sslKey', maxCount: 1 }
]), async (req, res) => {
    try {
        const { domain, projectId } = req.body;
        const sslCert = req.files['sslCert'][0];
        const sslKey = req.files['sslKey'][0];

        // Validate input
        if (!domain || !projectId || !sslCert || !sslKey) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Save domain mapping to database
        const domainMapping = new DomainMapping({
            domain,
            projectId,
            sslCertPath: sslCert.path,
            sslKeyPath: sslKey.path
        });
        await domainMapping.save();

        // Trigger Jenkins job
        const jenkinsUrl = 'http://yeduai.io:8080/job/ConfigureNginx/buildWithParameters';
        const params = new URLSearchParams({
            token: 'Ngin3xC0nfigT0ken',
            domain: domain,
            projectId: projectId,
            sslCertPath: sslCert.path,
            sslKeyPath: sslKey.path
        });

        const response = await fetch(`${jenkinsUrl}?${params}`, { method: 'POST' });

        if (response.ok) {
            res.json({ success: true, message: 'Domain mapping process initiated' });
        } else {
            throw new Error('Failed to trigger Jenkins job');
        }
    } catch (error) {
        console.error('Error in domain mapping process:', error);
        res.status(500).json({ success: false, message: 'An error occurred in the domain mapping process' });
    }
});