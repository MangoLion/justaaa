import JSZip from 'jszip';

export const syncGallery = async (pb, user, projects, toast) => {
  if (!user) {
    throw new Error('User must be logged in to sync');
  }

  try {
    toast({
      title: "Sync Started",
      description: "Checking cloud storage...",
    });

    // First check if user has an entry
    const records = await pb.collection('userdata').getList(1, 1, {
      filter: `user = "${user.id}"`
    });

    // Create zip of current gallery
    toast({
      title: "Sync Progress",
      description: "Preparing local gallery data...",
    });

    const zip = new JSZip();
    const galleryData = {
      projects,
      timestamp: new Date().toISOString()
    };
    zip.file('gallery.json', JSON.stringify(galleryData, null, 2));
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipFile = new File([zipBlob], 'gallery.zip', { type: 'application/zip' });

    if (records.items.length === 0) {
      // No existing entry - create new one
      toast({
        title: "Sync Progress",
        description: "Uploading gallery to cloud...",
      });

      const formData = new FormData();
      formData.append('user', user.id);
      formData.append('files', zipFile);
      
      await pb.collection('userdata').create(formData);
      return { type: 'upload', message: 'Gallery uploaded to cloud' };
    }

    // Existing entry found - check if we need to download or upload
    const record = records.items[0];
    if (record.files) {
      toast({
        title: "Sync Progress",
        description: "Comparing with cloud version...",
      });

      try {
        const fileUrl = pb.getFileUrl(record, record.files);
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        const zipData = await response.blob();
        const existingZip = await JSZip.loadAsync(zipData);
        const existingGalleryJson = await existingZip.file('gallery.json').async('string');
        const existingGallery = JSON.parse(existingGalleryJson);

        // Compare actual projects data
        const projectsChanged = JSON.stringify(existingGallery.projects) !== JSON.stringify(projects);

        if (projectsChanged) {
          // Return conflict data for resolution
          return {
            type: 'conflict',
            message: 'Differences detected between local and cloud versions',
            cloudData: existingGallery.projects,
            localData: projects,
            record: record, // Include the record in the conflict data
            async resolveConflict(choice, pb, record) {
              let resolvedProjects;
              
              switch(choice) {
                case 'merge':
                  // Create a map of all projects by ID
                  const projectMap = new Map();
                  
                  // Add local projects first
                  this.localData.forEach(project => {
                    projectMap.set(project.id, {...project});
                  });
                  
                  // Merge in cloud projects
                  this.cloudData.forEach(cloudProject => {
                    if (projectMap.has(cloudProject.id)) {
                      // Project exists in both - merge images
                      const localProject = projectMap.get(cloudProject.id);
                      const imageMap = new Map();
                      
                      // Add all local images
                      localProject.images.forEach(img => {
                        imageMap.set(img.id, img);
                      });
                      
                      // Add cloud images if they don't exist locally
                      cloudProject.images.forEach(img => {
                        if (!imageMap.has(img.id)) {
                          imageMap.set(img.id, img);
                        }
                      });
                      
                      localProject.images = Array.from(imageMap.values());
                      projectMap.set(cloudProject.id, localProject);
                    } else {
                      // Project only exists in cloud - add it
                      projectMap.set(cloudProject.id, cloudProject);
                    }
                  });
                  
                  resolvedProjects = Array.from(projectMap.values());
                  break;
                  
                case 'cloud':
                  resolvedProjects = this.cloudData;
                  break;
                  
                case 'local':
                  resolvedProjects = this.localData;
                  break;
                  
                default:
                  throw new Error('Invalid conflict resolution choice');
              }

              // Upload resolved version
              const resolvedGalleryData = {
                projects: resolvedProjects,
                timestamp: new Date().toISOString()
              };

              const resolvedZip = new JSZip();
              resolvedZip.file('gallery.json', JSON.stringify(resolvedGalleryData, null, 2));
              const resolvedZipBlob = await resolvedZip.generateAsync({ type: 'blob' });
              const resolvedZipFile = new File([resolvedZipBlob], 'gallery.zip', { type: 'application/zip' });

              const formData = new FormData();
              formData.append('files', resolvedZipFile);
              await pb.collection('userdata').update(record.id, formData);

              return {
                type: 'resolved',
                message: `Conflict resolved using ${choice} strategy`,
                projects: resolvedProjects
              };
            }
          };
        } else {
          return {
            type: 'none',
            message: 'Gallery is already in sync'
          };
        }
      } catch (error) {
        console.error('Error downloading file:', error);
        throw error;
      }
    }

    // Only reach here if no files exist in the record
    toast({
      title: "Sync Progress",
      description: "Uploading new version to cloud...",
    });

    const formData = new FormData();
    formData.append('files', zipFile);
    await pb.collection('userdata').update(record.id, formData);

    return { type: 'upload', message: 'Gallery uploaded to cloud' };

  } catch (error) {
    console.error('Sync failed:', error);
    throw error;
  }
};
