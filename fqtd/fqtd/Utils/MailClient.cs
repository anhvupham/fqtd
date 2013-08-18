using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Net.Mail;
using System.Net;
using System.Configuration;
using System.Text;

namespace fqtd.Utils
{
    public static class MailClient
    {
        private static readonly SmtpClient Client;

        static MailClient()
        {
            Client = new SmtpClient
            {
                Host = ConfigurationManager.AppSettings["SmtpServer"],
                Port = Convert.ToInt32(ConfigurationManager.AppSettings["SmtpPort"]),
                DeliveryMethod = SmtpDeliveryMethod.Network,
                EnableSsl= true
               
            };
            Client.UseDefaultCredentials = true;
            Client.Credentials = new NetworkCredential(ConfigurationManager.AppSettings["SmtpUser"], ConfigurationManager.AppSettings["SmtpPass"]);
        }

        private static bool SendMessage(string from, string to, string subject, string body)
        {
            MailMessage mm = null;
            bool isSent = false;
            try
            {
                // Create our message
                mm = new MailMessage(from, to, subject, body);
                mm.From = new MailAddress(from, "timdau.vn - lien he");
                if (ConfigurationManager.AppSettings["bccMailConfirm"] != "")
                    mm.Bcc.Add(new MailAddress(ConfigurationManager.AppSettings["bccMailConfirm"]));
                mm.IsBodyHtml = true;
                mm.SubjectEncoding = Encoding.UTF8;
                mm.DeliveryNotificationOptions = DeliveryNotificationOptions.OnFailure;

                // Send it
                Client.Send(mm);
                isSent = true;
            }
            // Catch any errors, these should be logged and dealt with later
            catch (Exception ex)
            {
                // If you wish to log email errors,
                // add it here...
                var exMsg = ex.Message;
            }
            finally
            {
                mm.Dispose();
            }

            return isSent;
        }

        public static bool SendConfirm(string email, string ConfirmLink, string cusName)
        {
            string body = @"
    <h3>
        Khách hàng " + cusName + @" liên hệ</h3>
    <br/>
        Vui lòng click link bên dưới để xem chi tiết.
<br/>   <br />
        <a href=" + ConfirmLink + @" style=font-size:20px; text-align: center>Xác nhận đơn hàng</a>
        <br />   <br />
        ";


            return SendMessage(ConfigurationManager.AppSettings["adminEmail"], email, "timdau.vn -   liên hệ", body);
        }

        public static bool SendLostPassword(string email, string password)
        {
            string body = "Your password is: " + password;

            return SendMessage(ConfigurationManager.AppSettings["adminEmail"], email, "Lost Password", body);
        }


    }
}