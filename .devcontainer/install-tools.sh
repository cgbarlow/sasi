#!/bin/bash

# Initialize report file
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPORT_FILE="$SCRIPT_DIR/installation-report.md"
echo "# 📦 DevContainer Installation Report" > "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "**Generated on:** $(date)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "## 📊 Installation Summary" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Track installation results
declare -A INSTALL_STATUS
declare -A INSTALL_NOTES

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to record installation status
record_status() {
    local tool="$1"
    local status="$2"
    local note="$3"
    
    INSTALL_STATUS["$tool"]="$status"
    INSTALL_NOTES["$tool"]="$note"
}

# Function to try installing a package
try_install() {
    local package="$1"
    local install_cmd="$2"
    
    echo "Attempting to install $package..."
    
    # Try without sudo first
    if $install_cmd 2>/dev/null; then
        echo "$package installed successfully without sudo"
        return 0
    fi
    
    # Try with sudo if available
    if command_exists sudo; then
        echo "Retrying with sudo..."
        if sudo $install_cmd 2>/dev/null; then
            echo "$package installed successfully with sudo"
            return 0
        fi
    fi
    
    echo "Failed to install $package - continuing without it"
    return 1
}

# Install tmux
echo "### 🖥️ Tmux Installation" >> "$REPORT_FILE"
if ! command_exists tmux; then
    if command_exists apt-get; then
        if try_install "tmux" "apt-get install -y tmux"; then
            record_status "tmux" "✅ Success" "Installed via apt-get"
        else
            record_status "tmux" "❌ Failed" "Installation failed - see manual instructions below"
        fi
    elif command_exists yum; then
        if try_install "tmux" "yum install -y tmux"; then
            record_status "tmux" "✅ Success" "Installed via yum"
        else
            record_status "tmux" "❌ Failed" "Installation failed - see manual instructions below"
        fi
    elif command_exists apk; then
        if try_install "tmux" "apk add tmux"; then
            record_status "tmux" "✅ Success" "Installed via apk"
        else
            record_status "tmux" "❌ Failed" "Installation failed - see manual instructions below"
        fi
    elif command_exists brew; then
        if try_install "tmux" "brew install tmux"; then
            record_status "tmux" "✅ Success" "Installed via brew"
        else
            record_status "tmux" "❌ Failed" "Installation failed - see manual instructions below"
        fi
    else
        record_status "tmux" "❌ Failed" "No supported package manager found"
    fi
else
    record_status "tmux" "✅ Already Installed" "Version: $(tmux -V 2>/dev/null || echo 'unknown')"
fi

# Install GitHub CLI
echo "### 🐙 GitHub CLI Installation" >> "$REPORT_FILE"
if ! command_exists gh; then
    if command_exists apt-get; then
        # For Debian/Ubuntu systems
        echo "Installing GitHub CLI for Debian/Ubuntu..."
        INSTALL_GH_DEB="(type -p wget >/dev/null || apt-get install wget -y) && \
            wget -qO- https://cli.github.com/packages/githubcli-archive-keyring.gpg | tee /usr/share/keyrings/githubcli-archive-keyring.gpg > /dev/null && \
            chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg && \
            echo 'deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main' | tee /etc/apt/sources.list.d/github-cli.list > /dev/null && \
            apt-get update && \
            apt-get install gh -y"
        
        # Try without sudo first
        if bash -c "$INSTALL_GH_DEB" 2>/dev/null; then
            record_status "gh" "✅ Success" "Installed via apt-get"
        elif command_exists sudo; then
            echo "Retrying GitHub CLI installation with sudo..."
            if sudo bash -c "$INSTALL_GH_DEB" 2>/dev/null; then
                record_status "gh" "✅ Success" "Installed via apt-get with sudo"
            else
                record_status "gh" "❌ Failed" "Installation failed - see manual instructions below"
            fi
        else
            record_status "gh" "❌ Failed" "Installation failed - see manual instructions below"
        fi
    elif command_exists yum; then
        if try_install "gh" "yum install -y gh"; then
            record_status "gh" "✅ Success" "Installed via yum"
        else
            record_status "gh" "❌ Failed" "Installation failed - see manual instructions below"
        fi
    elif command_exists brew; then
        if try_install "gh" "brew install gh"; then
            record_status "gh" "✅ Success" "Installed via brew"
        else
            record_status "gh" "❌ Failed" "Installation failed - see manual instructions below"
        fi
    else
        record_status "gh" "❌ Failed" "No supported package manager found"
    fi
else
    record_status "gh" "✅ Already Installed" "Version: $(gh --version 2>/dev/null | head -n1 || echo 'unknown')"
fi

# Install claude-code
echo "### 🤖 Claude Code Installation" >> "$REPORT_FILE"
if ! command_exists claude-code; then
    # Check for Node.js and npm first
    if command_exists node && command_exists npm; then
        echo "Installing claude-code via npm..."
        
        # Try npm install without sudo first
        if npm install -g @anthropic-ai/claude-code 2>/dev/null; then
            record_status "claude-code" "✅ Success" "Installed via npm"
        elif command_exists sudo; then
            echo "Retrying claude-code installation with sudo..."
            if sudo npm install -g @anthropic-ai/claude-code 2>/dev/null; then
                record_status "claude-code" "✅ Success" "Installed via npm with sudo"
            else
                record_status "claude-code" "❌ Failed" "Installation failed - see manual instructions below"
            fi
        else
            record_status "claude-code" "❌ Failed" "Installation failed - see manual instructions below"
        fi
    else
        record_status "claude-code" "❌ Failed" "Node.js and npm are required but not found"
    fi
else
    record_status "claude-code" "✅ Already Installed" "Version: $(claude-code --version 2>/dev/null || echo 'unknown')"
fi

# Write the status table to the report
echo "| Tool | Status | Notes |" >> "$REPORT_FILE"
echo "|------|--------|-------|" >> "$REPORT_FILE"
echo "| tmux | ${INSTALL_STATUS[tmux]} | ${INSTALL_NOTES[tmux]} |" >> "$REPORT_FILE"
echo "| GitHub CLI | ${INSTALL_STATUS[gh]} | ${INSTALL_NOTES[gh]} |" >> "$REPORT_FILE"
echo "| Claude Code | ${INSTALL_STATUS[claude-code]} | ${INSTALL_NOTES[claude-code]} |" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Add manual installation instructions for failed items
FAILED_ITEMS=0
for tool in tmux gh claude-code; do
    if [[ "${INSTALL_STATUS[$tool]}" == *"Failed"* ]]; then
        ((FAILED_ITEMS++))
    fi
done

if [ $FAILED_ITEMS -gt 0 ]; then
    echo "## ⚠️ Manual Installation Instructions" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "Some tools failed to install automatically. Please follow these instructions to install them manually:" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    if [[ "${INSTALL_STATUS[tmux]}" == *"Failed"* ]]; then
        echo "### 🖥️ Installing tmux manually" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        echo "**For Debian/Ubuntu:**" >> "$REPORT_FILE"
        echo '```bash' >> "$REPORT_FILE"
        echo "sudo apt update" >> "$REPORT_FILE"
        echo "sudo apt install -y tmux" >> "$REPORT_FILE"
        echo '```' >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        echo "**For Red Hat/CentOS/Fedora:**" >> "$REPORT_FILE"
        echo '```bash' >> "$REPORT_FILE"
        echo "sudo yum install -y tmux" >> "$REPORT_FILE"
        echo '```' >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        echo "**For macOS:**" >> "$REPORT_FILE"
        echo '```bash' >> "$REPORT_FILE"
        echo "brew install tmux" >> "$REPORT_FILE"
        echo '```' >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    fi
    
    if [[ "${INSTALL_STATUS[gh]}" == *"Failed"* ]]; then
        echo "### 🐙 Installing GitHub CLI manually" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        echo "**For Debian/Ubuntu:**" >> "$REPORT_FILE"
        echo '```bash' >> "$REPORT_FILE"
        echo "curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg" >> "$REPORT_FILE"
        echo "sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg" >> "$REPORT_FILE"
        echo 'echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null' >> "$REPORT_FILE"
        echo "sudo apt update" >> "$REPORT_FILE"
        echo "sudo apt install gh -y" >> "$REPORT_FILE"
        echo '```' >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        echo "**For macOS:**" >> "$REPORT_FILE"
        echo '```bash' >> "$REPORT_FILE"
        echo "brew install gh" >> "$REPORT_FILE"
        echo '```' >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        echo "**For other systems, visit:** https://github.com/cli/cli#installation" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    fi
    
    if [[ "${INSTALL_STATUS[claude-code]}" == *"Failed"* ]]; then
        echo "### 🤖 Installing Claude Code manually" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        echo "Claude Code requires Node.js and npm to be installed first." >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        echo "**Step 1: Install Node.js (if not already installed):**" >> "$REPORT_FILE"
        echo "Visit https://nodejs.org/ or use your package manager" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        echo "**Step 2: Install Claude Code:**" >> "$REPORT_FILE"
        echo '```bash' >> "$REPORT_FILE"
        echo "npm install -g @anthropic-ai/claude-code" >> "$REPORT_FILE"
        echo '```' >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        echo "**If you get permission errors, try:**" >> "$REPORT_FILE"
        echo '```bash' >> "$REPORT_FILE"
        echo "sudo npm install -g @anthropic-ai/claude-code" >> "$REPORT_FILE"
        echo '```' >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    fi
else
    echo "## ✅ All Tools Successfully Installed!" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "Your development environment is ready to use. Enjoy coding! 🎉" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"
echo "---" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "*Report generated at: $(date)*" >> "$REPORT_FILE"

echo "Tool installation script completed"
echo "Installation report saved to: $REPORT_FILE"
echo ""
echo "📋 To view the installation report, run:"
echo "    cat .devcontainer/installation-report.md"