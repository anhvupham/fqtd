using Mvc.Mailer;
using fqtd.Mailers.Models;

namespace fqtd.Mailers
{ 
    public interface IPasswordResetMailer
    {
			MvcMailMessage PasswordReset(MailerModel model);
	}
}