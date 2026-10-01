class UserSerializer
  def self.call(user)
    { id: user.id, email: user.email, role: user.role, created_at: user.created_at }
  end
end
