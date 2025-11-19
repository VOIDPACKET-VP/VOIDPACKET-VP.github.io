document.addEventListener('DOMContentLoaded', function() {
    const platformBoxes = document.querySelectorAll('.platform-box');
    const overlay = document.getElementById('platform-overlay');
    const closeBtn = document.querySelector('.close-btn');
    const expandedTitle = document.getElementById('expanded-title');
    const expandedDesc = document.getElementById('expanded-desc');
    const platformLink = document.getElementById('platform-link');
    const githubLink = document.getElementById('github-link');
    const platformsSection = document.querySelector('.hacking-platforms');

    // Click handler for platform boxes
    platformBoxes.forEach(box => {
        box.addEventListener('click', function() {
            const platformName = this.id;
            const description = this.getAttribute('data-desc');
            const link = this.getAttribute('data-link');
            const github = this.getAttribute('data-github');
            
            // Update overlay content
            expandedTitle.textContent = this.textContent;
            expandedDesc.textContent = description;
            platformLink.href = link;
            githubLink.href = `${github}`;
            
            // Show overlay and blur background
            overlay.classList.add('active');
            platformsSection.classList.add('blurred');
        });
    });

    // Close overlay
    closeBtn.addEventListener('click', function() {
        overlay.classList.remove('active');
        platformsSection.classList.remove('blurred');
    });

    // Close overlay when clicking outside content
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            overlay.classList.remove('active');
            platformsSection.classList.remove('blurred');
        }
    });

    // Close with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
            overlay.classList.remove('active');
            platformsSection.classList.remove('blurred');
        }
    });
});



// Discord username copy functionality
document.getElementById('discord-link').addEventListener('click', function(e) {
    e.preventDefault();
    navigator.clipboard.writeText('voidpacket_vp').then(() => {
        const tooltip = document.createElement('div');
        tooltip.className = 'discord-tooltip';
        tooltip.textContent = 'Discord username copied!';
        this.appendChild(tooltip);
        
        setTimeout(() => {
            tooltip.remove();
        }, 2000);
    });
});