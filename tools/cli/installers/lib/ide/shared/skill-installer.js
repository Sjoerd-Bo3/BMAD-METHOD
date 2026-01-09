const path = require('node:path');
const fs = require('fs-extra');
const { getSourcePath, getModulePath } = require('../../../../lib/project-root');

/**
 * Agent Skills Installer
 * Discovers skills from BMAD source and installs them to target locations
 * Skills work with both VS Code Copilot and Claude Code
 */
class SkillInstaller {
  constructor() {}

  /**
   * Discover all skills from core and selected modules
   * @param {Array<string>} selectedModules - Module names to include
   * @returns {Array<Object>} Array of skill info objects
   */
  async discoverSkills(selectedModules = []) {
    const skills = [];

    // Check core skills
    const corePath = getModulePath('core');
    const coreSkillsPath = path.join(corePath, this.skillsFolder);

    if (await fs.pathExists(coreSkillsPath)) {
      const coreSkills = await this.getSkillsFromDir(coreSkillsPath, 'core');
      skills.push(...coreSkills);
    }

    // Check module skills
    const modulesPath = getSourcePath('modules');
    for (const moduleName of selectedModules) {
      const moduleSkillsPath = path.join(modulesPath, moduleName, this.skillsFolder);

      if (await fs.pathExists(moduleSkillsPath)) {
        const moduleSkills = await this.getSkillsFromDir(moduleSkillsPath, moduleName);
        skills.push(...moduleSkills);
      }
    }

    return skills;
  }

  /**
   * Get skills from a directory
   * @param {string} skillsDir - Directory containing skill folders
   * @param {string} source - Source identifier (core or module name)
   * @returns {Array<Object>} Array of skill objects
   */
  async getSkillsFromDir(skillsDir, source) {
    const skills = [];

    try {
      const entries = await fs.readdir(skillsDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const skillPath = path.join(skillsDir, entry.name);
          const skillMdPath = path.join(skillPath, 'SKILL.md');

          if (await fs.pathExists(skillMdPath)) {
            const metadata = await this.parseSkillMetadata(skillMdPath);

            skills.push({
              name: entry.name,
              source,
              sourcePath: skillPath,
              skillMdPath,
              metadata,
            });
          }
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }

    return skills;
  }

  /**
   * Parse skill metadata from SKILL.md frontmatter
   * @param {string} skillMdPath - Path to SKILL.md file
   * @returns {Object} Parsed metadata
   */
  async parseSkillMetadata(skillMdPath) {
    const content = await fs.readFile(skillMdPath, 'utf8');
    const metadata = {
      name: '',
      description: '',
    };

    // Parse YAML frontmatter
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];

      const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
      if (nameMatch) {
        metadata.name = nameMatch[1].trim();
      }

      const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
      if (descMatch) {
        metadata.description = descMatch[1].trim();
      }
    }

    return metadata;
  }

  /**
   * Install skills to a target directory
   * @param {string} targetDir - Target directory (e.g., .github/skills or .claude/skills)
   * @param {Array<Object>} skills - Skills to install
   * @returns {Object} Installation result
   */
  async installSkills(targetDir, skills) {
    const result = {
      installed: 0,
      skipped: 0,
      errors: [],
    };

    await fs.ensureDir(targetDir);

    for (const skill of skills) {
      try {
        const targetSkillDir = path.join(targetDir, skill.name);

        // Copy entire skill directory
        await fs.copy(skill.sourcePath, targetSkillDir, {
          overwrite: true,
          errorOnExist: false,
        });

        result.installed++;
      } catch (error) {
        result.errors.push({
          skill: skill.name,
          error: error.message,
        });
      }
    }

    return result;
  }

  /**
   * Clean up previously installed BMAD skills
   * @param {string} targetDir - Directory to clean
   * @param {Array<Object>} skills - Skills that would be installed (to know what to remove)
   * @returns {number} Number of skills removed
   */
  async cleanup(targetDir, skills) {
    let removed = 0;

    if (!(await fs.pathExists(targetDir))) {
      return removed;
    }

    // Get list of skill names that BMAD installs
    const bmadSkillNames = new Set(skills.map((s) => s.name));

    try {
      const entries = await fs.readdir(targetDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory() && bmadSkillNames.has(entry.name)) {
          // Only remove if it's a BMAD-managed skill
          const skillPath = path.join(targetDir, entry.name);
          await fs.remove(skillPath);
          removed++;
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }

    return removed;
  }

  /**
   * Install skills for GitHub Copilot (VS Code)
   * @param {string} projectDir - Project directory
   * @param {Array<string>} selectedModules - Selected modules
   * @returns {Object} Installation result
   */
  async installForGitHubCopilot(projectDir, selectedModules = []) {
    const targetDir = path.join(projectDir, '.github', 'skills');
    const skills = await this.discoverSkills(selectedModules);

    if (skills.length === 0) {
      return { installed: 0, skipped: 0, errors: [] };
    }

    // Clean up old BMAD skills first
    await this.cleanup(targetDir, skills);

    return this.installSkills(targetDir, skills);
  }

  /**
   * Install skills for Claude Code
   * @param {string} projectDir - Project directory
   * @param {Array<string>} selectedModules - Selected modules
   * @returns {Object} Installation result
   */
  async installForClaudeCode(projectDir, selectedModules = []) {
    // Claude Code uses .claude/skills/ as legacy location (also .github/skills/ is supported)
    const targetDir = path.join(projectDir, '.claude', 'skills');
    const skills = await this.discoverSkills(selectedModules);

    if (skills.length === 0) {
      return { installed: 0, skipped: 0, errors: [] };
    }

    // Clean up old BMAD skills first
    await this.cleanup(targetDir, skills);

    return this.installSkills(targetDir, skills);
  }
  skillsFolder = 'skills';
}

module.exports = { SkillInstaller };
