  // Page Navigation
        document.querySelectorAll('[data-page]').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const pageId = this.getAttribute('data-page');
                
                // Hide all pages
                document.querySelectorAll('.page-content').forEach(page => {
                    page.classList.remove('active');
                });
                
                // Show selected page
                document.getElementById(pageId).classList.add('active');
                
                // Update active nav link
                document.querySelectorAll('#main-nav .nav-link').forEach(navLink => {
                    navLink.classList.remove('active');
                });
                this.classList.add('active');
                
                // Close sidebar if in mobile view
                if (window.innerWidth < 768) {
                    document.querySelector('.sidebar').classList.remove('show');
                }
                
                // Update document title and header
                const pageTitle = this.querySelector('.nav-text') ? this.querySelector('.nav-text').textContent : 'Dashboard';
                document.title = `${pageTitle} | RealEstate Pro`;
                document.getElementById('page-title').textContent = pageTitle;
                
                // Update header subtitle based on page
                let subtitle = '';
                switch(pageId) {
                    case 'dashboard':
                        subtitle = "Here's what's happening with your business today.";
                        break;
                    case 'admin-panel':
                        subtitle = "Manage all agents and system settings.";
                        break;
                    case 'agent-panel':
                        subtitle = "Manage your property listings and clients.";
                        break;
                    case 'profile':
                        subtitle = "View and edit your profile information.";
                        break;
                    case 'contact-us':
                        subtitle = "Get in touch with our team for any inquiries.";
                        break;
                    case 'blog':
                        subtitle = "Latest news and insights about real estate.";
                        break;
                    default:
                        subtitle = `Manage your ${pageTitle.toLowerCase()}.`;
                }
                document.querySelector('.header-subtitle').textContent = subtitle;
            });
        });

        // Toggle sidebar in mobile view
        document.getElementById('sidebarToggle')?.addEventListener('click', function() {
            document.querySelector('.sidebar').classList.toggle('show');
        });

        // Toggle admin/agent 
        function toggleUserRole(role) {
            const badge = document.getElementById('user-role-badge');
            const username = document.getElementById('username-display');
            const headerUsername = document.getElementById('header-username');
            const adminItems = document.querySelectorAll('.admin-only');
            const agentItems = document.querySelectorAll('.agent-only');
            
            if (role === 'admin') {
                badge.textContent = 'ADMIN PANEL';
                username.textContent = 'Admin User';
                headerUsername.textContent = 'Admin User';
                adminItems.forEach(item => item.style.display = 'block');
                agentItems.forEach(item => item.style.display = 'none');
            } else {
                badge.textContent = 'AGENT PANEL';
                username.textContent = 'John Agent';
                headerUsername.textContent = 'John Agent';
                adminItems.forEach(item => item.style.display = 'none');
                agentItems.forEach(item => item.style.display = 'block');
            }
        }

        // Dark mode toggle
        document.getElementById('themeToggle')?.addEventListener('click', function() {
            const html = document.documentElement;
            const icon = this.querySelector('i');
            
            if (html.getAttribute('data-bs-theme') === 'dark') {
                html.removeAttribute('data-bs-theme');
                icon.classList.replace('fa-sun', 'fa-moon');
                localStorage.setItem('theme', 'light');
            } else {
                html.setAttribute('data-bs-theme', 'dark');
                icon.classList.replace('fa-moon', 'fa-sun');
                localStorage.setItem('theme', 'dark');
            }
        });

        // Profile edit functionality
        document.getElementById('edit-profile-btn')?.addEventListener('click', function() {
            const form = document.getElementById('profile-form');
            const inputs = form.querySelectorAll('input, textarea, select');
            const buttons = document.getElementById('profile-form-buttons');
            
            inputs.forEach(input => {
                input.disabled = false;
            });
            
            buttons.style.display = 'block';
            this.style.display = 'none';
        });
        
        document.getElementById('cancel-profile-edit')?.addEventListener('click', function() {
            const form = document.getElementById('profile-form');
            const inputs = form.querySelectorAll('input, textarea, select');
            const buttons = document.getElementById('profile-form-buttons');
            const editBtn = document.getElementById('edit-profile-btn');
            
            inputs.forEach(input => {
                input.disabled = true;
                // Here you would reset to original values from database
            });
            
            buttons.style.display = 'none';
            editBtn.style.display = 'block';
        });
        
        document.getElementById('save-profile-changes')?.addEventListener('click', function() {
            // Here you would save changes to database
            alert('Profile changes saved!');
            document.getElementById('cancel-profile-edit').click();
        });

        // Contact form submission
        document.getElementById('contactForm')?.addEventListener('submit', function(e) {
            e.preventDefault();
            fetch(this.action, {
                method: 'POST',
                body: new FormData(this)
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message || 'Thank you for your message! We will get back to you soon.');
                this.reset();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('There was an error submitting your message. Please try again.');
            });
        });

        // Initialize tooltips
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });

        // Form submissions
        document.getElementById('profile-form')?.addEventListener('submit', function(e) {
            e.preventDefault();
            fetch(this.action, {
                method: 'PUT',
                body: new FormData(this)
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message || 'Profile updated successfully');
                location.reload();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error updating profile');
            });
        });

        document.getElementById('change-password-form')?.addEventListener('submit', function(e) {
            e.preventDefault();
            fetch(this.action, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPassword: document.getElementById('current-password').value,
                    newPassword: document.getElementById('new-password').value,
                    confirmPassword: document.getElementById('confirm-password').value
                })
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message || 'Password changed successfully');
                this.reset();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error changing password');
            });
        });

        document.getElementById('addAgentForm')?.addEventListener('submit', function(e) {
            e.preventDefault();
            fetch(this.action, {
                method: 'POST',
                body: new FormData(this)
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message || 'Agent added successfully');
                location.reload();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error adding agent');
            });
        });

        document.getElementById('addPropertyForm')?.addEventListener('submit', function(e) {
            e.preventDefault();
            fetch(this.action, {
                method: 'POST',
                body: new FormData(this)
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message || 'Property added successfully');
                location.reload();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error adding property');
            });
        });

     

        // Initialize on DOM load
        document.addEventListener('DOMContentLoaded', function() {
            // Check for saved theme preference
            if (localStorage.getItem('theme') === 'dark') {
                document.documentElement.setAttribute('data-bs-theme', 'dark');
                const themeToggle = document.getElementById('themeToggle');
                if (themeToggle) {
                    themeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
                }
            }
            
            // Add demo buttons (for demonstration only)
            const demoButtons = `
                <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 11">
                    <div class="btn-group" role="group">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="toggleUserRole('admin')">Admin View</button>
                        <button type="button" class="btn btn-secondary btn-sm" onclick="toggleUserRole('agent')">Agent View</button>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', demoButtons);
            
            // Initialize charts
            if (document.getElementById('viewsChart')) {
                new Chart(document.getElementById('viewsChart'), {
                    type: 'line',
                    data: {
                        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                        datasets: [{
                            label: "Property Views",
                            lineTension: 0.3,
                            backgroundColor: "rgba(78, 115, 223, 0.05)",
                            borderColor: "rgba(78, 115, 223, 1)",
                            pointRadius: 3,
                            pointBackgroundColor: "rgba(78, 115, 223, 1)",
                            pointBorderColor: "rgba(78, 115, 223, 1)",
                            pointHoverRadius: 3,
                            pointHoverBackgroundColor: "rgba(78, 115, 223, 1)",
                            pointHoverBorderColor: "rgba(78, 115, 223, 1)",
                            pointHitRadius: 10,
                            pointBorderWidth: 2,
                            data: [421, 531, 625, 784, 982, 1245, 1420, 1250, 1100, 1340, 980, 1120],
                        }],
                    },
                    options: {
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            x: {
                                grid: {
                                    display: false
                                }
                            },
                            y: {
                                ticks: {
                                    beginAtZero: true
                                }
                            }
                        }
                    }
                });
            }
            
            if (document.getElementById('leadSourcesChart')) {
                new Chart(document.getElementById('leadSourcesChart'), {
                    type: 'doughnut',
                    data: {
                        labels: ["Website", "Social Media", "Referrals", "Direct"],
                        datasets: [{
                            data: [55, 30, 10, 5],
                            backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e'],
                            hoverBackgroundColor: ['#2e59d9', '#17a673', '#2c9faf', '#dda20a'],
                            hoverBorderColor: "rgba(234, 236, 244, 1)",
                        }],
                    },
                    options: {
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        cutout: '70%',
                    }
                });
            }
            
            if (document.getElementById('locationChart')) {
                new Chart(document.getElementById('locationChart'), {
                    type: 'bar',
                    data: {
                        labels: ["DHA", "Bahria", "Askari", "Other"],
                        datasets: [{
                            label: "Properties",
                            backgroundColor: "#4e73df",
                            hoverBackgroundColor: "#2e59d9",
                            borderColor: "#4e73df",
                            data: [65, 45, 32, 18],
                        }],
                    },
                    options: {
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            x: {
                                grid: {
                                    display: false
                                }
                            },
                            y: {
                                ticks: {
                                    beginAtZero: true
                                }
                            }
                        }
                    }
                });
            }
            
            if (document.getElementById('clientStatusChart')) {
                new Chart(document.getElementById('clientStatusChart'), {
                    type: 'doughnut',
                    data: {
                        labels: ["Active", "Leads", "Inactive"],
                        datasets: [{
                            data: [35, 15, 10],
                            backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc'],
                            hoverBackgroundColor: ['#2e59d9', '#17a673', '#2c9faf'],
                            hoverBorderColor: "rgba(234, 236, 244, 1)",
                        }],
                    },
                    options: {
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        cutout: '70%',
                    }
                });
            }
        });