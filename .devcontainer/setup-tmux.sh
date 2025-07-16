#!/bin/bash

# Install tmux
echo "Installing tmux..."
sudo apt-get update && sudo apt-get install -y tmux

# Create tmux config
echo "Setting up tmux configuration..."
cat > ~/.tmux.conf << 'EOF'
# Enable mouse support
set -g mouse on

# Start windows and panes at 1, not 0
set -g base-index 1
setw -g pane-base-index 1

# Better colors
set -g default-terminal "screen-256color"

# Bigger history
set -g history-limit 50000

# More intuitive split commands
bind | split-window -h -c "#{pane_current_path}"
bind - split-window -v -c "#{pane_current_path}"

# Reload config
bind r source-file ~/.tmux.conf \; display "Config reloaded!"

# Don't rename windows automatically
set-option -g allow-rename off
EOF

# Create a helper script for Claude
cat > ~/tmux-claude << 'EOF'
#!/bin/bash
# Start or attach to Claude session
if tmux has-session -t claude 2>/dev/null; then
    echo "Attaching to existing Claude session..."
    tmux attach-session -t claude
else
    echo "Creating new Claude session..."
    tmux new-session -s claude
fi
EOF
chmod +x ~/tmux-claude

echo "Tmux setup complete! Use 'tmux' to start or '~/tmux-claude' for Claude session"