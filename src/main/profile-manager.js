const fs = require('fs');
const path = require('path');

class ProfileManager {
  constructor(baseDirectory) {
    this.baseDirectory = path.resolve(baseDirectory);
    this.instancesDirectory = path.join(this.baseDirectory, 'velkora-profiles');
    fs.mkdirSync(this.instancesDirectory, { recursive: true });
  }

  getDirectory(profile) {
    if (profile?.gameDirectory) return path.resolve(profile.gameDirectory);
    if (!profile?.id || Number(profile.id) === 1) return this.baseDirectory;
    return path.join(this.instancesDirectory, String(profile.id));
  }

  ensureDirectories(profile) {
    const directory = this.getDirectory(profile);
    for (const name of ['mods', 'resourcepacks', 'shaderpacks', 'saves', 'logs']) {
      fs.mkdirSync(path.join(directory, name), { recursive: true });
    }
    return directory;
  }

  assignDirectory(profile) {
    const nextProfile = { ...profile };
    if (Number(nextProfile.id) !== 1 && !nextProfile.gameDirectory) {
      nextProfile.gameDirectory = path.join(this.instancesDirectory, String(nextProfile.id));
    }
    this.ensureDirectories(nextProfile);
    return nextProfile;
  }
}

module.exports = ProfileManager;
